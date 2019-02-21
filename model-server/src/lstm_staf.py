import functools
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
from train_utils import masked_acc, split_train_val, fit_and_log

K = keras.backend
Model = keras.Model
Input = keras.layers.Input
Embedding = keras.layers.Embedding
Lambda = keras.layers.Lambda
concatenate = keras.layers.concatenate
LSTM = keras.layers.LSTM
CuDNNLSTM = keras.layers.CuDNNLSTM
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

    def get_model(self, vocab_size, batch_size=None, stateful=False):
        # Build a one hot encoding on the fly. Use one hot instead of embedding since the vocab_size is small
        sequence_inputs_layer = Input(batch_shape=(batch_size, None), name='sequence_inputs_layer', dtype='int32')
        embedded_inputs = Lambda(lambda x: K.one_hot(x, vocab_size), name='one_hot_inputs')(sequence_inputs_layer)

        # Add a second input for the categories and repeat it across the sequence length dimension
        category_inputs_layer = Input(batch_shape=(batch_size, len(CATEGORIES)), name='category_inputs_layer')
        category_repeat_layer = Lambda(lambda args: keras.layers.RepeatVector(K.shape(args[1])[1])(args[0]),
                                       output_shape=(batch_size, len(CATEGORIES)),
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
        dense_output = Dense(vocab_size, name='dense_output')(lstm_2)
        softmax_output = Softmax()(dense_output)

        # Define training model
        train_inputs = [sequence_inputs_layer, category_inputs_layer]
        train_outputs = [dense_output]
        train_model = Model(inputs=train_inputs, outputs=train_outputs)

        # Define sampling model
        sample_inputs = [sequence_inputs_layer, category_inputs_layer]
        sample_outputs = [softmax_output]
        sample_model = Model(inputs=sample_inputs, outputs=sample_outputs)

        return train_model, sample_model

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
        model, _ = self.get_model(vocab_size)

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

        # Build a new model and load just the weights but use a batch-size and sequence-length different from the
        # training without softmax output. This allows the prediction of sequences of any size. Additionally no CUDA
        # is needed for the sampling. Note that the RNN layers need to be stateful so Keras does not reset the state
        # after every batch.
        category_shape = (1, len(CATEGORIES))
        _, model = self.get_model(vocab.size, batch_size=1, stateful=True)
        model.load_weights(self.model_dir + 'lstm-model.h5')
        model.summary()

        # Build a graph to pick a prediction from the logits returned by the RNN
        # This graph picks randomly from the probabilities
        model_output = tf.placeholder(tf.float32, shape=(1, None, vocab.size))
        logits = tf.squeeze(model_output, 0)
        temp = tf.placeholder(tf.float32)
        logits_scaled = tf.div(logits, temp)
        prediction = tf.multinomial(logits_scaled, num_samples=1)[-1, 0]

        # Define and return a method that performs the sampling on the loaded model and graph
        def do_sampling(start_string, category_weights=None, temperature=1.0, max_generate=100):
            category_weights = [0.0, 0.0, 1.0, 0.0, 0.0] if category_weights is None else category_weights
            category_weights = np.array(category_weights).reshape(category_shape)

            # Immediately return the start string
            for char in start_string:
                yield bytes([char])

            # Keep a record of the generated bytes
            generated = [to_idx[char] for char in start_string]

            # Make sure that the correct graph is used
            with graph.as_default():
                # Create a tensorflow session
                sess = tf.Session()

                # Feed the start string
                model.reset_states()
                if len(generated) > 1:
                    model_input = [np.array([generated[:-1]]), category_weights]
                    model.predict(model_input)

                # Now generate by constantly feeding the last generated index and predicting the next
                for i in range(len(start_string), max_generate):
                    try:
                        model_input_idx = generated[-1]
                        model_input = [np.array([[model_input_idx]]), category_weights]
                        output = model.predict(model_input)

                        # Pick with multinomial distribution to get a single prediction
                        predicted_idx = sess.run(prediction,
                                                 feed_dict={model_output: output, temp: temperature})

                        # Append and yield prediction
                        generated.append(predicted_idx)
                        yield bytes([from_idx[predicted_idx]])

                        predicted_int = int(from_idx[predicted_idx])
                        if predicted_int == END_OF_FILE_CHAR:
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
