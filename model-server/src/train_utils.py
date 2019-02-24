import datetime
import pathlib
import functools
import numpy as np
import tensorflow as tf
from tensorflow import keras

K = keras.backend


def get_lstm_layer():
    """
    Retunrs CuDNNLSTM if a GPU is available, otherwise the regular LSTM
    :return:
    """
    if tf.test.is_gpu_available():
        return keras.layers.CuDNNLSTM
    else:
        return functools.partial(keras.layers.LSTM, activation='tanh', recurrent_activation='sigmoid')


class TemperatureSampling(tf.keras.layers.Layer):
    """
    Keras layer for temperature sampling from logits
    """
    def __init__(self):
        super().__init__()

    def call(self, logits, temperature=None, **kwargs):
        logits_scaled = tf.divide(logits, temperature)
        prediction = tf.multinomial(logits_scaled, num_samples=1)[-1, 0]
        return prediction


def split_train_val(input_data, output_data, weights, batch_size, val_split):
    """
    Shuffles and splits data manually into train and test to make sure that the batch size is correct
    :param input_data:
    :param output_data:
    :param weights:
    :param batch_size:
    :param val_split:
    :return:
    """
    # Shuffle data
    num_rows = input_data[0].shape[0]
    p = np.random.permutation(num_rows)
    input_data = [i[p] for i in input_data]
    output_data = [o[p] for o in output_data]

    # Figure out how many batches will be train and test
    batch_count = num_rows // batch_size
    train_batch_count = int(batch_count * (1.0 - val_split))
    val_batch_count = batch_count - train_batch_count
    train_count = train_batch_count * batch_size
    val_count = val_batch_count * batch_size

    # Split data into train and test
    train_input_data = [i[:train_count] for i in input_data]
    val_input_data = [i[train_count:train_count + val_count] for i in input_data]
    train_output_data = [o[:train_count] for o in output_data]
    val_output_data = [o[train_count:train_count + val_count] for o in output_data]

    # Handle weights
    train_weights = None
    val_weights = None
    if weights is not None:
        weights = weights[p]
        train_weights = weights[:train_count]
        val_weights = weights[train_count:train_count + val_count]

    return train_input_data, train_output_data, train_weights, val_input_data, val_output_data, val_weights


def masked_acc(mask_classes, acc_name='acc'):
    """
    Provides an accuracy function that ignores a list of class indices

    :param mask_classes:
    List of class indices to be excluded from the accuracy

    :param acc_name:
    Name of the accuracy function

    :return:
    """
    def acc(y_true, y_pred):
        true_class = K.argmax(y_true, axis=-1)
        pred_class = K.argmax(y_pred, axis=-1)
        masks = K.stack([K.not_equal(true_class, mask_class) for mask_class in mask_classes])
        accuracy_mask = K.cast(K.all(masks, axis=0), 'int32')
        accuracy_tensor = K.cast(K.equal(true_class, pred_class), 'int32') * accuracy_mask
        accuracy = K.sum(accuracy_tensor) / K.maximum(K.sum(accuracy_mask), 1)
        return accuracy
    acc.__name__ = acc_name
    return acc


def fit_and_log(model, output_dir, *args, model_name='model', callbacks=None, **kwargs):
    """
    Trains the provided model. Saves it when the training is done or interrupted and stores a log using tensorboard

    :param model:
    The model to be trained

    :param output_dir:
    The output directory where both the model and the log will be stored

    :param model_name:
    Name of the model

    :param args:
    Arguments for the fit method

    :param callbacks:
    List of callbacks for the fit method. Will be extended with a tensorboard logger

    :param kwargs:
    Keyword arguments for the fit method

    :return:
    """
    # Make sure the output directory exists
    pathlib.Path(output_dir).mkdir(parents=True, exist_ok=True)
    pathlib.Path(output_dir + '/tensorboard-log').mkdir(parents=True, exist_ok=True)

    # Create a tensorboard logger and attach it to the list of callbacks
    callbacks = callbacks if callbacks is not None else []
    log_date_str = datetime.datetime.now().strftime('%Y-%m-%d-%H-%M-%S')
    log_dir = output_dir + '/tensorboard-log/{}'.format(log_date_str)
    tensor_board_callback = keras.callbacks.TensorBoard(log_dir=log_dir, write_graph=True)
    callbacks.append(tensor_board_callback)

    # Train, save a copy of the model if training is interrupted
    try:
        model.fit(*args, callbacks=callbacks, **kwargs)
    except KeyboardInterrupt:
        print('Saving current state of model...')
        model.save(output_dir + '/' + model_name + '-interrupted.h5')
        raise
    model.save(output_dir + '/' + model_name + '.h5')
