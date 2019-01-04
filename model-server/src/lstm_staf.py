import pathlib, sys
import pandas as pd
import numpy as np
import tensorflow.keras.backend as K
from knitpaint import KnitPaint
from lstm import LSTMModel

PADDING_CHAR = 0
END_OF_LINE_CHAR = 151
END_OF_FILE_CHAR = 152


class LSTMModelStaf(LSTMModel):
    """
    Uses knit patterns from the staf library to train an lstm
    """

    def __init__(self):
        super().__init__()
        self.trained_width = None
        self.data_dir = '../data/raw/staf/'
        self.training_dir = '../data/processed/training-files/lstm-staf/'
        self.model_dir = '../output/models/lstm-staf/'

    def get_training_filename(self):
        """
        Overrides the inherited function with a static filename
        :return:
        """
        return 'training-sequences'

    def generate_training_file(self):
        """
        Reads all the files that were found to be useful for training,
        :return:
        """
        # Read patterns
        df = pd.DataFrame(pd.read_json(self.data_dir + 'staf-details-training.json'))

        # Find max sequence length
        max_sequence_length = ((df['apex_width'] + 1) * df['apex_height']).max()

        # Sequences will contain the color numbers left to right, bottom to top. The sequences will be padded to fit the
        # maximum sequence length. A linebreak character will be placed at the end of each line, at the end of the
        # pattern a special character will be placed as well
        sequences = np.ones((df.shape[0], max_sequence_length), dtype=int) * PADDING_CHAR

        print('\n\nReading Input Files...')
        for i, (_, row) in enumerate(df.iterrows()):
            apex_file = self.data_dir + row['apex_file']
            knitpaint = KnitPaint(apex_file)
            knitpaint.add_char_col(END_OF_LINE_CHAR)
            sequence = np.array(knitpaint.bitmap_data)
            sequence[-1] = END_OF_FILE_CHAR
            sequences[i, :sequence.size] = sequence

        # Weights will be 1 for values and 0 for padding. End of line and end of file should have weight 10 and 100.
        weights = np.ones_like(sequences, dtype=int)
        weights = np.where(sequences == PADDING_CHAR,     np.zeros_like(weights, dtype=int), weights)
        weights = np.where(sequences == END_OF_LINE_CHAR, np.ones_like(weights, dtype=int) * 10, weights)
        weights = np.where(sequences == END_OF_FILE_CHAR, np.ones_like(weights, dtype=int) * 100, weights)

        # Extract the vocabulary
        print('\n\nExtracting vocabulary...')
        vocab = np.unique(sequences.flatten())
        vocab.sort()

        # Save sequences and vocabulary
        print('\n\nSaving results...')
        training_filename = self.get_training_filename()
        pathlib.Path(self.training_dir).mkdir(parents=True, exist_ok=True)
        np.save(self.training_dir + training_filename + '.npy', sequences)
        np.save(self.training_dir + training_filename + '-weights.npy', weights)
        np.save(self.training_dir + training_filename + '-vocab.npy', vocab)

    def train(self, metrics=None, **kwargs):
        """
        Trains the model
        :param metrics:
        :param kwargs:
        :return:
        """
        metrics = [] if metrics is None else metrics
        _, _, to_idx = self.read_vocab()

        # Define a accuracy function that ignores the padding
        def acc(y_true, y_pred):
            mask_class = to_idx[PADDING_CHAR]
            true_class = K.argmax(y_true, axis=-1)
            pred_class = K.argmax(y_pred, axis=-1)
            accuracy_mask = K.cast(K.not_equal(true_class, mask_class), 'int32')
            accuracy_tensor = K.cast(K.equal(true_class, pred_class), 'int32') * accuracy_mask
            accuracy = K.sum(accuracy_tensor) / K.maximum(K.sum(accuracy_mask), 1)
            return accuracy
        metrics.append(acc)

        super().train(metrics=metrics, **kwargs)

    def sample(self):
        """
        Samples using the inherited sampling function but stops when a end of file character is generated
        :param start_string:
        :param temperature:
        :param max_generate:
        :return:
        """
        super_do_sample = super().sample()

        def do_sample(start_string, temperature, max_generate):
            for predicted in super_do_sample(start_string, temperature, max_generate):
                yield predicted
                predicted_int = int(predicted[0])
                if predicted_int == END_OF_FILE_CHAR:
                    break

        return do_sample


if __name__ == '__main__':
    lstm_model = LSTMModelStaf()

    if sys.argv[1] == 'generate-training-file':
        print('Generating training file...')
        lstm_model.generate_training_file()
    elif sys.argv[1] == 'train':
        print('Training...')
        lstm_model.train(use_weights=True)
    elif sys.argv[1] == 'sample':
        print('Sampling...')
        start = [1]*8 + [END_OF_LINE_CHAR] + [1]*2
        for test in lstm_model.sample()(start, 0.01, 400):
            print('Sampled: ' + str(test))

    print('Done!')
