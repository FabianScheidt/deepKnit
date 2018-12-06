import os, logging
from flask import Flask, Response, request
from flask_cors import CORS
from lstm import LSTMModel
from sliding_window import SlidingWindowModel

# Create flask app that allows to sample from previously trained models
app = Flask(__name__, static_url_path='', static_folder='../static')
app.logger.setLevel(logging.INFO)
cors = CORS(app)

# Use just one GPU for this server
os.environ["CUDA_DEVICE_ORDER"] = "PCI_BUS_ID"
os.environ["CUDA_VISIBLE_DEVICES"] = "1"


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


@app.route('/*', methods=['OPTIONS'])
def send_cors_options():
    """
    Handle any OPTIONS request to allow CORS
    :return:
    """
    resp = Response('')
    set_cache_headers(resp)
    return resp


@app.route('/stream', methods=['POST'])
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
        model = LSTMModel()
        resp = Response(model.sample(start, temperature, num_generate), mimetype='application/octet-stream')
    elif model == 'sliding-window':
        model = SlidingWindowModel()
        resp = Response(model.sample(width, start, temperature, num_generate), mimetype='application/octet-stream')
    else:
        resp = Response('Unknown model', status=400)
    set_cache_headers(resp)
    return resp


# Run flask app and make it available
app.run(host='0.0.0.0', threaded=True)
