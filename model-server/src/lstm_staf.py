import pathlib, sys, functools, os
import pandas as pd
import numpy as np
import tensorflow as tf
from tensorflow import keras
from knitpaint import KnitPaint
from lstm import LSTMModel
from train_utils import masked_acc
from knitpaint import read_linebreak
from knitpaint.check import KnitPaintCheckException

K = keras.backend
Input = keras.layers.Input
Embedding = keras.layers.Embedding
Lambda = keras.layers.Lambda
concatenate = keras.layers.concatenate
LSTM = keras.layers.LSTM
CuDNNLSTM = keras.layers.CuDNNLSTM
Dense = keras.layers.Dense

PADDING_CHAR = 0
BG_CHAR = 1
START_OF_FILE_CHAR = 150
END_OF_LINE_CHAR = 151
END_OF_FILE_CHAR = 152
CATEGORIES = ['Cable/Aran', 'Stitch move', 'Links', 'Miss', 'Tuck']

os.environ['TF_CPP_MIN_LOG_LEVEL'] = '3'


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
        self.epochs = 200

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
        max_sequence_length = ((df['apex_width'] + 1) * df['apex_height']).max() + 2

        # Sequences will contain the color numbers left to right, bottom to top. The sequences will be padded to fit the
        # maximum sequence length. A linebreak character will be placed at the end of each line, at the end of the
        # pattern a special character will be placed as well
        sequences = np.ones((df.shape[0], max_sequence_length), dtype=int) * PADDING_CHAR

        # Categories will be 0 if a category is not present and greater than that if it is.
        # The sum of each row will be 1
        categories = np.zeros((df.shape[0], len(CATEGORIES)), dtype=float)

        print('\n\nReading Input Files...')
        for i, (_, row) in enumerate(df.iterrows()):
            apex_file = self.data_dir + row['apex_file']
            knitpaint = KnitPaint(apex_file)
            knitpaint.normalize_color_numbers()
            knitpaint.add_char_col(END_OF_LINE_CHAR)
            sequence = np.array(knitpaint.bitmap_data)
            sequence = np.array([START_OF_FILE_CHAR, *sequence, END_OF_FILE_CHAR])
            sequences[i, :sequence.size] = sequence
            for j, category in enumerate(CATEGORIES):
                categories[i, j] = 1.0 if category in row['category'] else 0.0

        # Normalize rows of categories so they sum up to 1.0
        categories_row_sums = categories.sum(axis=1)
        categories = categories / categories_row_sums[:, np.newaxis]

        # Find and print some category statistics
        unique_categories, unique_categories_counts = np.unique(categories, axis=0, return_counts=True)
        unique_categories_counts = np.expand_dims(unique_categories_counts, axis=1)
        unique_categories = np.hstack((unique_categories_counts, unique_categories))
        unique_categories = unique_categories[(-unique_categories[:, 0]).argsort()]
        print('\n\nCategory counts:\n')
        with np.printoptions(formatter={'float': '{: 0.2f}'.format}):
            print(unique_categories)

        # Weights will be 1 for values and 0 for padding. End of line and end of file should have weight 10 and 100.
        weights = np.ones_like(sequences, dtype=int)
        weights = np.where(sequences == PADDING_CHAR,     np.zeros_like(weights, dtype=int), weights)
        weights = np.where(sequences == 1,                np.ones_like(weights, dtype=int) * 0.8, weights)
        weights = np.where(sequences == 2,                np.ones_like(weights, dtype=int) * 0.9, weights)
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
        np.save(self.training_dir + training_filename + '-categories.npy', categories)
        np.save(self.training_dir + training_filename + '-weights.npy', weights)
        np.save(self.training_dir + training_filename + '-vocab.npy', vocab)

    def read_training_dataset(self):
        categories = np.load(self.training_dir + self.get_training_filename() + '-categories.npy')
        res = super().read_training_dataset()
        res[0].append(categories)
        return res

    def get_model(self, vocab_size, batch_shape, stateful=False, softmax=True):
        # Build a one hot encoding on the fly. Use one hot instead of embedding since the vocab_size is small
        sequence_inputs_layer = Input(batch_shape=batch_shape[0], name='sequence_inputs_layer', dtype='int32')
        embedded_inputs = Lambda(lambda x: K.one_hot(x, vocab_size), name='one_hot_inputs')(sequence_inputs_layer)

        # Add a second input for the categories and repeat it across the sequence length dimension
        category_inputs_layer = Input(batch_shape=batch_shape[1], name='category_inputs_layer')
        category_repeat_layer = Lambda(lambda args: keras.layers.RepeatVector(K.shape(args[1])[1])(args[0]),
                                       output_shape=(batch_shape[0][1], batch_shape[1][1]),
                                       name='category_repeat_layer')([category_inputs_layer, embedded_inputs])

        # Concatenate both inputs
        concatenate_layer = concatenate([embedded_inputs, category_repeat_layer])

        if tf.test.is_gpu_available():
            lstm_layer = CuDNNLSTM
        else:
            lstm_layer = functools.partial(LSTM, activation='tanh', recurrent_activation='sigmoid')

        lstm_1 = lstm_layer(300, return_sequences=True, recurrent_initializer='glorot_uniform',
                            stateful=stateful, name='lstm_1')(concatenate_layer)
        lstm_2 = lstm_layer(300, return_sequences=True, recurrent_initializer='glorot_uniform',
                            stateful=stateful, name='lstm_2')(lstm_1)

        # Dense output: One element for each color number in the vocabulary
        activation = 'softmax' if softmax else None
        dense_output = Dense(vocab_size, name='dense_output', activation=activation)(lstm_2)
        model = keras.Model(inputs=[sequence_inputs_layer, category_inputs_layer], outputs=dense_output)
        return model

    def train(self, metrics=None, **kwargs):
        """
        Trains the model
        :param metrics:
        :param kwargs:
        :return:
        """
        metrics = [] if metrics is None else metrics
        _, _, to_idx = self.read_vocab()

        # Define accuracy functions that ignores the padding and the background single jersey
        acc_full = masked_acc([to_idx[PADDING_CHAR]], acc_name='FULL')
        acc_fg = masked_acc([to_idx[PADDING_CHAR], to_idx[BG_CHAR]], acc_name='FG')
        metrics.append('acc')
        metrics.append(acc_full)
        metrics.append(acc_fg)

        super().train(metrics=metrics, **kwargs)

    def sample(self, additional_batch_shape=None):
        """
        Samples using the inherited sampling function but stops when a end of file character is generated
        :return:
        """
        category_shape = (1, len(CATEGORIES))
        additional_batch_shape = [category_shape] if additional_batch_shape is None else additional_batch_shape
        super_do_sample = super().sample(additional_batch_shape=additional_batch_shape)

        def do_sample(start_string, category_weights, temperature=1.0, max_generate=100):
            additional_inputs = [np.array(category_weights).reshape(category_shape)]
            samples = super_do_sample(start_string, temperature=temperature,
                                      num_generate=max_generate, additional_inputs=additional_inputs)
            for predicted in samples:
                yield predicted
                predicted_int = int(predicted[0])
                if predicted_int == END_OF_FILE_CHAR:
                    break

        return do_sample

    def evaluate(self):
        """
        Samples from the model using various temperatures and categories. Then performs a check for each sample and
        stores the resulting evaluation
        :return:
        """
        sample = self.sample()
        evaluation = []

        # Configure evaluation parameters
        temperatures = [1.5, 1.0, 0.7, 0.5, 0.2, 0.1, 0.001]
        category_weights_names = ['Move', 'Cable', 'Miss', 'Move and Miss', 'Move and Links', 'Links', 'Cable and Move',
                                  'Cable and Links', 'Miss and Links', 'Tuck', 'Move and Tuck', 'Tuck and Links',
                                  'Miss and Tuck', 'Cable and Miss', 'Cable, Move, Links', 'Cable and Tuck',
                                  'Move, Links, Tuck', 'Cable, Links, Miss', 'Cable, Move, Miss']
        category_weights_train_counts = [393, 213, 120, 96, 75, 69, 54, 54, 28, 23, 21, 7, 6, 5, 2, 2, 1, 1, 1]
        category_weights_values = [
            [0.0, 1.0, 0.0, 0.0, 0.0],
            [1.0, 0.0, 0.0, 0.0, 0.0],
            [0.0, 0.0, 0.0, 1.0, 0.0],
            [0.0, 0.5, 0.0, 0.5, 0.0],
            [0.0, 0.5, 0.5, 0.0, 0.0],
            [0.0, 0.0, 1.0, 0.0, 0.0],
            [0.5, 0.5, 0.0, 0.0, 0.0],
            [0.5, 0.0, 0.5, 0.0, 0.0],
            [0.0, 0.0, 0.5, 0.5, 0.0],
            [0.0, 0.0, 0.0, 0.0, 1.0],
            [0.0, 0.5, 0.0, 0.0, 0.5],
            [0.0, 0.0, 0.5, 0.0, 0.5],
            [0.0, 0.0, 0.0, 0.5, 0.5],
            [0.5, 0.0, 0.0, 0.5, 0.0],
            [1/3, 1/3, 1/3, 0.0, 0.0],
            [0.5, 0.0, 0.0, 0.0, 0.5],
            [0.0, 1/3, 1/3, 0.0, 1/3],
            [1/3, 0.0, 1/3, 1/3, 0.0],
            [1/3, 1/3, 0.0, 1/3, 0.0]
        ]
        assert len(category_weights_names) == len(category_weights_values)
        num_samples = 20

        # Configure progress logger and silence tensorflow
        progress = tf.keras.utils.Progbar(len(temperatures) * len(category_weights_values) * num_samples)
        progress_counter = 0

        for temperature in temperatures:
            for i, category_weights in enumerate(category_weights_values):
                # Keep a set of hashes of previously sampled knitpaint
                previous = set()

                # Sample some knitpaint
                for _ in range(num_samples):

                    # Sample and create knitpaint object from result
                    generated_res = bytes()
                    for s in sample([START_OF_FILE_CHAR], category_weights, temperature=temperature, max_generate=400):
                        generated_res = generated_res + s
                    knitpaint = read_linebreak(generated_res[1:-1], 151, padding_char=1)
                    knitpaint_hash = hash(bytes(knitpaint.bitmap_data))

                    # Check if the data is knittable
                    knittable = True
                    try:
                        knitpaint.check_as_pattern()
                    except (KnitPaintCheckException, AttributeError, ZeroDivisionError, NotImplementedError):
                        knittable = False

                    # Append to result list
                    evaluation.append({
                        'temperature': temperature,
                        'category_weights_value': category_weights,
                        'category_weights_name': category_weights_names[i],
                        'category_weights_train_count': category_weights_train_counts[i],
                        'knittable': knittable,
                        'unique': knitpaint_hash not in previous,
                        'width': knitpaint.get_width(),
                        'height': knitpaint.get_height(),
                        'area': len(knitpaint.bitmap_data)
                    })

                    # Save matching knitpaint some for MetaKnit project
                    if knittable and knitpaint.get_width() == 4 and knitpaint.get_height() == 6 \
                            and knitpaint_hash not in previous and 0.1 < temperature < 0.8:
                        knitpaint.write_dat(self.model_dir + 'meta-knit/' + str(progress_counter) + '.dat')

                    # Add to set of previous knitpaint
                    previous.add(knitpaint_hash)

                    # Log progress
                    progress_counter += 1
                    progress.update(progress_counter)

        # Convert evaluation to data frame and save it
        df = pd.DataFrame(evaluation)
        df.to_excel(self.model_dir + 'evaluation.xlsx')

        # Calculate and some metrics
        unique_and_knittable_mean = df.groupby(['temperature', 'category_weights_name'])[['knittable', 'unique']].mean()
        knittable = df[df['knittable']]
        unique_of_knittable_mean = knittable.groupby(['temperature', 'category_weights_name'])[['unique']].mean()
        unique_of_knittable_mean = unique_of_knittable_mean.rename(columns={'unique': 'unique-of-knittable'})
        unique_knittable = pd.concat([unique_and_knittable_mean, unique_of_knittable_mean], axis=1, sort=False)
        unique_knittable_pivot = pd.pivot_table(unique_knittable, values=['knittable', 'unique', 'unique-of-knittable'],
                                                index=['temperature'], columns=['category_weights_name'],
                                                aggfunc='mean')
        knittable_widths = knittable.groupby(['width']).size()
        knittable_heights = knittable.groupby(['height']).size()
        knittable_areas = knittable.groupby(['area']).size()

        # Save to excel
        writer = pd.ExcelWriter(self.model_dir + 'evaluation_metrics.xlsx', engine='xlsxwriter')
        unique_knittable.to_excel(writer, sheet_name='Means')
        unique_knittable_pivot.to_excel(writer, sheet_name='Means Pivot')
        knittable_widths.to_excel(writer, sheet_name='Knittable Widths')
        knittable_heights.to_excel(writer, sheet_name='Knittable Heights')
        knittable_areas.to_excel(writer, sheet_name='Knittable Areas')
        writer.save()


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
        for test in lstm_model.sample()(start, temperature=0.01, max_generate=400):
            print('Sampled: ' + str(test))
    elif sys.argv[1] == 'evaluate':
        print('Evaluating...')
        lstm_model.evaluate()

    print('Done!')
