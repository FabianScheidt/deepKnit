import numpy as np
from tensorflow import keras
K = keras.backend


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
        accuracy_mask = K.cast(K.any(masks, axis=0), 'int32')
        accuracy_tensor = K.cast(K.equal(true_class, pred_class), 'int32') * accuracy_mask
        accuracy = K.sum(accuracy_tensor) / K.maximum(K.sum(accuracy_mask), 1)
        return accuracy
    acc.__name__ = acc_name
    return acc
