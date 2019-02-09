import os, logging, base64, datetime, pathlib, time
from uuid import UUID
from flask import Flask, Response, request, json
from flask_cors import CORS
from lstm import LSTMModel
import lstm_staf
from lstm_staf import LSTMModelStaf
from sliding_window import SlidingWindowModel
from knitpaint import KnitPaint
import knitpaint
import numpy as np

# Create flask app that allows to sample from previously trained models
app = Flask(__name__, static_url_path='', static_folder='../static')
app.logger.setLevel(logging.INFO)
cors = CORS(app)

# Don't use the GPU for the server
os.environ["CUDA_DEVICE_ORDER"] = "PCI_BUS_ID"
os.environ["CUDA_VISIBLE_DEVICES"] = "-1"

# Initialize models
lstm_model = LSTMModel()
sample_lstm = lstm_model.sample()
lstm_model_staf = LSTMModelStaf()
sample_lstm_staf = lstm_model_staf.sample()
lstm_model_staf_locked = False
sliding_window_model = SlidingWindowModel()
sample_sliding_window = sliding_window_model.sample()


@app.route('/', methods=['GET'], defaults={'path': ''})
@app.route('/<path>', methods=['GET'])
def serve_static(path):
    """
    Serves static static files. Falls back to index.html
    :return:
    """
    requested_filename = os.path.join(app.static_folder, path)
    if os.path.isfile(requested_filename):
        return app.send_static_file(path)
    app.logger.info('Requested file does not exist. Falling back to index.html')
    return app.send_static_file('index.html')


def set_cache_headers(resp):
    """
    Sets some headers to avoid any caching
    :param resp:
    :return:
    """
    resp.headers['Cache-Control'] = 'no-cache, no-store, must-revalidate'
    resp.headers['Pragma'] = 'no-cache'
    resp.headers['Expires'] = '0'


@app.route('/api/*', methods=['OPTIONS'])
def send_cors_options():
    """
    Handle any OPTIONS request to allow CORS
    :return:
    """
    resp = Response('')
    set_cache_headers(resp)
    return resp


@app.route('/api/sample', methods=['POST'])
def sample_model():
    """
    Samples knitpaint pixels and returns the result in chunks
    :return:
    """

    # Set default options
    model = 'lstm'
    temperature = 1.0
    num_generate = 57*70
    start = [0]
    width = 57

    # Try to read options from JSON
    options = request.get_json()
    if 'model' in options:
        model = options['model']
    if 'start' in options:
        start = options['start']
    if 'temperature' in options:
        temperature = options['temperature']
    if 'num_generate' in options:
        num_generate = options['num_generate']
    if 'width' in options:
        width = options['width']

    # Return respective response
    if model == 'lstm':
        resp = Response(sample_lstm(start, temperature=temperature, num_generate=num_generate),
                        mimetype='application/octet-stream')
    elif model == 'lstm-staf':
        start = [s for s in start if s != 0]
        category_weights = [0, 0, 1, 0, 0]

        def lstm_staf_generator():
            i = 0
            sample = sample_lstm_staf(start, category_weights, temperature=temperature, max_generate=num_generate)
            for generated in sample:
                yield generated
                i += 1
                if int(generated[0]) == lstm_staf.END_OF_LINE_CHAR:
                    add_count = width - (i % width)
                    yield bytes([0] * add_count)
                    i += add_count
                if i >= num_generate:
                    break

        resp = Response(lstm_staf_generator(), mimetype='application/octet-stream')
    elif model == 'sliding-window':
        resp = Response(sample_sliding_window(width, start, temperature, num_generate),
                        mimetype='application/octet-stream')
    else:
        resp = Response('Unknown model', status=400)
    set_cache_headers(resp)
    return resp


@app.route('/api/from-dat', methods=['POST'])
def from_dat():
    """
    Reads from a provided dat file and returns the content as list of color numbers
    :return:
    """
    dat_bytes = request.stream.read()
    handler = KnitPaint(dat_bytes)
    resp = Response(knitpaint_to_json(handler), mimetype='application/json')
    set_cache_headers(resp)
    return resp


@app.route('/api/to-dat', methods=['POST'])
def to_dat():
    """
    Converts the provided knitpaint data to a dat file and streams back the file
    :return:
    """
    data = [0]
    width = 57

    # Try to read options from JSON
    options = request.get_json()
    if 'data' in options:
        data = base64.b64decode(options['data'])
    if 'width' in options:
        width = options['width']

    # Make sure the length of the data matches the width
    if len(data) % width != 0:
        data += [0] * (width - len(data) % width)

    # Use KnitpaintFileHandler to generate the dat file
    height = len(data) // width
    handler = KnitPaint()
    handler.set_bitmap_data(data, width, height)
    dat_bytes = handler.write_dat()
    resp = Response(dat_bytes, mimetype='application/octet-stream')
    set_cache_headers(resp)
    return resp


@app.route('/api/pattern', methods=['GET'])
def get_pattern():
    # Read URL parameters
    args = request.args
    temperature = 0.7 if args.get('temperature') is None else float(args.get('temperature'))
    cable = 0.2 if args.get('cable') is None else float(args.get('cable'))
    stitch_move = 0.2 if args.get('stitchMove') is None else float(args.get('stitchMove'))
    links = 0.2 if args.get('links') is None else float(args.get('links'))
    miss = 0.2 if args.get('miss') is None else float(args.get('miss'))
    tuck = 0.2 if args.get('tuck') is None else float(args.get('tuck'))

    global lstm_model_staf_locked
    while lstm_model_staf_locked:
        print('Locked')
        time.sleep(0.01)
    lstm_model_staf_locked = True

    # Sample from lstm staf model
    start = [1, 1, 1, 1, 1, 1]
    category_weights = [cable, stitch_move, links, miss, tuck]
    sample = sample_lstm_staf(start, category_weights, temperature=temperature, max_generate=400)
    generated_res = bytes()
    for generated in sample:
        generated_res = generated_res + generated

    lstm_model_staf_locked = False

    # Read result as knitpaint
    handler = knitpaint.read_linebreak(generated_res[:-1], 151, padding_char=1)
    resp = Response(knitpaint_to_json(handler), mimetype='application/json')
    set_cache_headers(resp)
    return resp


@app.route('/api/log-project', methods=['POST'])
def log_project():
    # Read project
    body = request.get_json()
    project = body['project']

    # Sanitize uuids
    client_uuid = str(UUID(body['clientUuid']))
    project_uuid = str(UUID(project['uuid']))

    # Make sure the proper folder is there
    project_folder = '../log/' + 'client-' + client_uuid + '/project-' + project_uuid + '/'
    pathlib.Path(project_folder).mkdir(parents=True, exist_ok=True)

    # Save the file
    filename = datetime.datetime.now().strftime('%Y-%m-%d-%H-%M-%S-%f') + '.deepknitproject'
    with open(project_folder + filename, 'w') as outfile:
        json.dump(project, outfile)

    return ''


def knitpaint_to_json(handler):
    return json.dumps({
        'data': base64.b64encode(bytes(handler.bitmap_data)).decode(),
        'width': handler.get_width()
    })


# Run flask app to make it available for development
if __name__ == "__main__":
    app.run(host='0.0.0.0', threaded=True)
