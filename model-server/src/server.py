import os, logging, base64, datetime, pathlib
from functools import reduce
from uuid import UUID
from flask import Flask, Response, request, json
from flask_cors import CORS
from lstm_staf import LSTMModelStaf, START_OF_FILE_CHAR, END_OF_LINE_CHAR
from knitpaint import KnitPaint, KnitPaintCheckException
from knitpaint.check import KnitPaintCheckSyntaxError, KnitPaintCheckError, KnitPaintCheckWarning
import knitpaint

# Create flask app that allows to sample from previously trained models
app = Flask(__name__, static_url_path='', static_folder='../static')
app.logger.setLevel(logging.INFO)
cors = CORS(app)

# Don't use the GPU for the server
os.environ["CUDA_DEVICE_ORDER"] = "PCI_BUS_ID"
os.environ["CUDA_VISIBLE_DEVICES"] = "-1"

# Initialize model
lstm_model_staf = LSTMModelStaf()
sample_lstm_staf = lstm_model_staf.sample()


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


@app.route('/api/from-dat', methods=['POST'])
def from_dat():
    """
    Reads from a provided dat file and returns the content as list of color numbers
    :return:
    """
    dat_bytes = request.stream.read()
    handler = KnitPaint(dat_bytes)
    resp = Response(json.dumps(knitpaint_to_dict(handler)), mimetype='application/json')
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


@app.route('/api/pattern', methods=['POST'])
def get_pattern():
    # Read and sanitize options
    options = request.get_json()

    method = 'stochastic' if 'method' not in options else options['method']

    method_options = {} if 'methodOptions' not in options else options['methodOptions']
    temperature = 0.7 if 'temperature' not in method_options else method_options['temperature']
    k = 5 if 'k' not in method_options else method_options['k']
    k = max(1, min(16, k))
    length_normalization = True if 'lengthNormalization' not in method_options else \
        bool(method_options['lengthNormalization'])
    length_bonus_factor = 0 if 'lengthBonusFactor' not in method_options else float(method_options['lengthBonusFactor'])

    weights = {} if 'categoryWeights' not in options else options['categoryWeights']
    cable = 0.2 if 'cable' not in weights else float(weights['cable'])
    stitch_move = 0.2 if 'stitchMove' not in weights else float(weights['stitchMove'])
    links = 0.2 if 'links' not in weights else float(weights['links'])
    miss = 0.2 if 'miss' not in weights else float(weights['miss'])
    tuck = 0.2 if 'tuck' not in weights else float(weights['tuck'])
    category_weights = [cable, stitch_move, links, miss, tuck]

    max_generate = 400 if 'maxGenerate' not in options else int(options['maxGenerate'])
    max_generate = max(1, min(1000, max_generate))

    # Sample from lstm staf model. Start with start character
    start_seq = [START_OF_FILE_CHAR]
    sample = sample_lstm_staf(start_seq, category_weights=category_weights, method=method, temperature=temperature, k=k,
                              length_normalization=length_normalization, length_bonus_factor=length_bonus_factor,
                              max_generate=max_generate)
    generated_res = []
    for generated in sample:
        generated_res += generated

    # Read result as knitpaint
    handler = knitpaint.read_linebreak(generated_res[1:-1], 151, padding_char=1)
    json_resp = knitpaint_to_dict(handler)

    # Perform a check
    try:
        handler.check_as_pattern()
        json_resp['generator_error'] = False
        json_resp['syntax_error'] = False
        json_resp['knit_error'] = False
        json_resp['knit_warning'] = False
    except (AttributeError, ZeroDivisionError, NotImplementedError):
        json_resp['generator_error'] = True
        json_resp['syntax_error'] = False
        json_resp['knit_error'] = False
        json_resp['knit_warning'] = False
    except KnitPaintCheckException as e:
        json_resp['generator_error'] = False
        json_resp['syntax_error'] = reduce(lambda a, b: a or isinstance(b, KnitPaintCheckSyntaxError), e.problems, False)
        json_resp['knit_error'] = reduce(lambda a, b: a or isinstance(b, KnitPaintCheckError), e.problems, False)
        json_resp['knit_warning'] = reduce(lambda a, b: a or isinstance(b, KnitPaintCheckWarning), e.problems, False)

    # Return the response
    resp = Response(json.dumps(json_resp), mimetype='application/json')
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


def knitpaint_to_dict(handler):
    return {
        'data': base64.b64encode(bytes(handler.bitmap_data)).decode(),
        'width': handler.get_width()
    }


# Run flask app to make it available for development
if __name__ == "__main__":
    app.run(host='0.0.0.0', threaded=True)
