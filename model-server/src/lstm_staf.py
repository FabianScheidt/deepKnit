import os
import pathlib
import sys

import numpy as np
import pandas as pd
import tensorflow as tf
from tensorflow import keras

from knitpaint import KnitPaint
from knitpaint import read_linebreak
from knitpaint.check import KnitPaintCheckException
from train_utils import masked_acc, split_train_val, fit_and_log, get_lstm_layer, TemperatureSampling

K = keras.backend
Model = keras.Model
Input = keras.layers.Input
Embedding = keras.layers.Embedding
Lambda = keras.layers.Lambda
concatenate = keras.layers.concatenate
Dense = keras.layers.Dense
Softmax = keras.layers.Softmax

PADDING_CHAR = 0
BG_CHAR = 1
START_OF_FILE_CHAR = 150
END_OF_LINE_CHAR = 151
END_OF_FILE_CHAR = 152
CATEGORIES = ['Cable/Aran', 'Stitch move', 'Links', 'Miss', 'Tuck']

os.environ['TF_CPP_MIN_LOG_LEVEL'] = '3'


class LSTMModelStaf:
    """
    Uses knit patterns from the staf library to train an lstm
    """

    def __init__(self):
        super().__init__()
        self.data_dir = '../data/raw/staf/'
        self.training_dir = '../data/processed/training-files/lstm-staf/'
        self.model_dir = '../output/models/lstm-staf/'
        self.epochs = 200
        self.batch_size = 32

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
        pathlib.Path(self.training_dir).mkdir(parents=True, exist_ok=True)
        np.save(self.training_dir + 'training-sequences.npy', sequences)
        np.save(self.training_dir + 'training-sequences-categories.npy', categories)
        np.save(self.training_dir + 'training-sequences-weights.npy', weights)
        np.save(self.training_dir + 'training-sequences-vocab.npy', vocab)

    def read_vocab(self):
        """
        Reads the vocabulary from previously generated training files
        :return:
        """
        # Read vocabulary
        vocab = np.load(self.training_dir + 'training-sequences-vocab.npy')

        # Build lookups
        to_idx = np.zeros(256, dtype=int)
        from_idx = np.zeros(256, dtype=int)
        for idx, data in enumerate(np.nditer(vocab)):
            to_idx[data] = idx
            from_idx[idx] = data

        return vocab, from_idx, to_idx

    def read_training_dataset(self):
        """
        Reads and returns the previously generated training data files
        :return:
        """
        # Read sequences
        sequences = np.load(self.training_dir + 'training-sequences.npy')
        weights = np.load(self.training_dir + 'training-sequences-weights.npy')

        # Read categories
        categories = np.load(self.training_dir + 'training-sequences-categories.npy')

        # Read vocabulary
        vocab, from_idx, to_idx = self.read_vocab()
        vocab_size = vocab.size

        # Transform sequences to index representation
        sequences = to_idx[sequences]

        # Split into inputs and outputs
        input_data = [sequences[:, :-1], categories]
        output_data = [sequences[:, 1:]]
        weights = weights[:, -output_data[0].shape[1]:]

        return input_data, output_data, weights, vocab_size, from_idx, to_idx

    def _get_model_input(self, vocab_size, batch_size):
        # Build a one hot encoding on the fly. Use one hot instead of embedding since the vocab_size is small
        sequence_input = Input(batch_shape=(batch_size, None), name='sequence_inputs_layer', dtype='int32')
        embedded_input = Lambda(lambda x: K.one_hot(x, vocab_size), name='one_hot_inputs')(sequence_input)

        # Add a second input for the categories and repeat it across the sequence length dimension
        category_input = Input(batch_shape=(batch_size, len(CATEGORIES)), name='category_inputs_layer')
        category_repeated = Lambda(lambda args: keras.layers.RepeatVector(K.shape(args[1])[1])(args[0]),
                                   output_shape=(batch_size, len(CATEGORIES)),
                                   name='category_repeat_layer')([category_input, embedded_input])

        # Concatenate both inputs
        concatenated_inputs = concatenate([embedded_input, category_repeated])
        return sequence_input, category_input, concatenated_inputs

    def get_train_model(self, vocab_size, batch_size=None):
        # Get concatenated inputs
        sequence_input, category_input, concatenated_inputs = self._get_model_input(vocab_size, batch_size)

        # Define two lstm layers
        lstm_layer_1 = get_lstm_layer()(300, return_sequences=True, recurrent_initializer='glorot_uniform',
                                        name='lstm_1')
        lstm_layer_2 = get_lstm_layer()(300, return_sequences=True, recurrent_initializer='glorot_uniform',
                                        name='lstm_2')

        # Dense output: One element for each color number in the vocabulary
        dense_output_layer = Dense(vocab_size, name='dense_output')
        softmax_output_layer = Softmax(name='softmax_output')

        # Now assemble the layers
        lstm_1 = lstm_layer_1(concatenated_inputs)
        lstm_2 = lstm_layer_2(lstm_1)
        dense_output = dense_output_layer(lstm_2)
        softmax_output = softmax_output_layer(dense_output)

        # Define training model
        inputs = [sequence_input, category_input]
        outputs = [softmax_output]
        return Model(inputs=inputs, outputs=outputs)

    def get_sample_model(self, vocab_size, batch_size=None):
        # Get concatenated inputs
        sequence_input, category_input, concatenated_inputs = self._get_model_input(vocab_size, batch_size)

        # Define two lstm layers
        lstm_layer_1 = get_lstm_layer()(300, return_sequences=True, return_state=True, name='lstm_1')
        lstm_layer_2 = get_lstm_layer()(300, return_sequences=False, return_state=True, name='lstm_2')

        # The sampling model needs additional inputs for the lstm states
        lstm_1_states_input = [Input(batch_shape=(batch_size, 300), name='lstm_1_initial_h'),
                               Input(batch_shape=(batch_size, 300), name='lstm_1_initial_c')]
        lstm_2_states_input = [Input(batch_shape=(batch_size, 300), name='lstm_2_initial_h'),
                               Input(batch_shape=(batch_size, 300), name='lstm_2_initial_c')]

        # Dense output: One element for each color number in the vocabulary
        dense_output_layer = Dense(vocab_size, name='dense_output')

        # Now assemble the layers
        lstm_1, lstm_1_h, lstm_1_c = lstm_layer_1(concatenated_inputs, initial_state=lstm_1_states_input)
        lstm_2, lstm_2_h, lstm_2_c = lstm_layer_2(lstm_1, initial_state=lstm_2_states_input)
        lstm_1_states = [lstm_1_h, lstm_1_c]
        lstm_2_states = [lstm_2_h, lstm_2_c]
        dense_output = dense_output_layer(lstm_2)

        # Create an additional input and output for temperature sampling
        temperature_input = Input(batch_shape=(batch_size, 1), name='temperature')
        prediction = TemperatureSampling()(dense_output, temperature=temperature_input)

        # Define sampling model
        inputs = [sequence_input, category_input, temperature_input] + lstm_1_states_input + lstm_2_states_input
        outputs = [dense_output, prediction] + lstm_1_states + lstm_2_states
        return Model(inputs=inputs, outputs=outputs)

    def get_initial_state(self):
        """
        Returns a random initial state for the model
        :return:
        """
        sess = tf.Session()
        with tf.variable_scope("initial_state", reuse=tf.AUTO_REUSE):
            h_1 = tf.get_variable('h_1', shape=(1, 300), initializer=tf.initializers.glorot_uniform, dtype=tf.float32)
            c_1 = tf.get_variable('c_1', shape=(1, 300), initializer=tf.initializers.glorot_uniform, dtype=tf.float32)
            h_2 = tf.get_variable('h_2', shape=(1, 300), initializer=tf.initializers.glorot_uniform, dtype=tf.float32)
            c_2 = tf.get_variable('c_2', shape=(1, 300), initializer=tf.initializers.glorot_uniform, dtype=tf.float32)
        sess.run(tf.global_variables_initializer())
        return sess.run([h_1, c_1, h_2, c_2])

    def train(self, val_split=0.05):
        """
        Trains the model
        :param val_split:
        :return:
        """
        # Read input and output data
        input_data, output_data, weights, vocab_size, _, to_idx = self.read_training_dataset()
        output_data = tf.keras.utils.to_categorical(output_data, vocab_size)

        # Shuffle and split data manually into train and test to make sure that the batch size is correct
        train_input_data, train_output_data, train_weights, val_input_data, val_output_data, val_weights = \
            split_train_val(input_data, output_data, weights, self.batch_size, val_split)

        # Define accuracy functions that ignore the padding and the background single jersey
        acc_full = masked_acc([to_idx[PADDING_CHAR]], acc_name='FULL')
        acc_fg = masked_acc([to_idx[PADDING_CHAR], to_idx[BG_CHAR]], acc_name='FG')
        metrics = ['acc', acc_full, acc_fg]

        # Get the model
        model = self.get_train_model(vocab_size)

        # Compile the model
        model.compile(optimizer=tf.train.AdamOptimizer(),
                      sample_weight_mode='temporal',
                      loss='categorical_crossentropy', metrics=metrics)
        model.summary()

        # Fit the data. Use Tensorboard to visualize the progress
        fit_and_log(model, self.model_dir, model_name='lstm-model',
                    x=train_input_data, y=train_output_data, sample_weight=train_weights,
                    validation_data=(val_input_data, val_output_data, val_weights),
                    batch_size=self.batch_size, epochs=self.epochs, shuffle=True)

    def sample(self):
        """
        Samples using the inherited sampling function but stops when a end of file character is generated
        :return:
        """
        # Get a reference to the default tensorflow graph
        graph = tf.get_default_graph()

        # Load the vocabulary
        vocab, from_idx, to_idx = self.read_vocab()

        # Load the model with batch size 1 and load the weights from the previously trained model
        category_shape = (1, len(CATEGORIES))
        model = self.get_sample_model(vocab.size, batch_size=1)
        model.load_weights(self.model_dir + 'lstm-model.h5', by_name=True)
        model.summary()

        # Define and return a method that performs the sampling on the loaded model and graph
        def do_sampling(start_string, category_weights=None, method='stochastic', temperature=1.0, max_generate=100):
            category_weights = [0.0, 0.0, 1.0, 0.0, 0.0] if category_weights is None else category_weights
            category_weights = np.array(category_weights).reshape(category_shape)
            temperature = np.array([temperature])

            if method not in ['stochastic', 'greedy']:
                raise NotImplementedError

            # Immediately return the start string
            for char in start_string:
                yield bytes([char])

            # Keep a record of the generated bytes
            generated = [to_idx[char] for char in start_string]

            # Now generate by constantly feeding the last generated index and predicting the next
            last_generated = None
            last_state = self.get_initial_state()
            for i in range(len(start_string) - 1, max_generate):
                try:
                    # Prepare model input
                    input_seq = np.array([generated]) if last_generated is None else np.array([[last_generated]])
                    model_input = [input_seq, category_weights, temperature] + last_state

                    # Predict and make sure that the correct graph is used
                    with graph.as_default():
                        dense_output, prediction, lstm_1_h, lstm_1_c, lstm_2_h, lstm_2_c = model.predict(model_input)
                    last_state = [lstm_1_h, lstm_1_c, lstm_2_h, lstm_2_c]

                    if method == 'greedy':
                        last_generated = np.argmax(dense_output[0], axis=0)
                    else:
                        last_generated = int(prediction)

                    # Append and yield prediction
                    generated.append(last_generated)
                    yield bytes([from_idx[last_generated]])

                    # Stop if end of file character is reached
                    if last_generated == to_idx[END_OF_FILE_CHAR]:
                        break
                except GeneratorExit:
                    return

        return do_sampling

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
        num_samples = 2000

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
        lstm_model.train()
    elif sys.argv[1] == 'sample':
        print('Sampling...')
        start = [START_OF_FILE_CHAR]
        for test in lstm_model.sample()(start, temperature=0.01, max_generate=400):
            print('Sampled: ' + str(test))
    elif sys.argv[1] == 'evaluate':
        print('Evaluating...')
        lstm_model.evaluate()

    print('Done!')
