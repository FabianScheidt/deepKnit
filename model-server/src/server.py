import os, logging, base64
from flask import Flask, Response, request, json
from flask_cors import CORS
from lstm import LSTMModel
import lstm_staf
from lstm_staf import LSTMModelStaf
from sliding_window import SlidingWindowModel
from knitpaint import KnitPaint

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
        resp = Response(sample_lstm(start, temperature, num_generate), mimetype='application/octet-stream')
    elif model == 'lstm-staf':
        start = [s for s in start if s != 0]

        def lstm_staf_generator():
            i = 0
            for generated in sample_lstm_staf(start, temperature, num_generate):
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
        resp = Response(sample_sliding_window(width, start, temperature, num_generate), mimetype='application/octet-stream')
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
    res = json.dumps({
        'data': base64.b64encode(bytes(handler.bitmap_data)).decode(),
        'width': handler.get_width()
    })
    resp = Response(res, mimetype='application/json')
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


# Run flask app to make it available for development
if __name__ == "__main__":
    app.run(host='0.0.0.0', threaded=True)
