import pathlib
import sys
import os
import functools
import numpy as np
import tensorflow as tf
from tensorflow import keras
from knitpaint import KnitPaint
from train_utils import split_train_val, fit_and_log


class LSTMModel:

    def __init__(self):
        self.trained_width = 50
        self.linebreak_char = 151
        self.lines_per_sequence = 4
        self.batch_size = 32
        self.epochs = 1000
        self.training_dir = '../data/processed/training-files/lstm/'
        self.model_dir = '../output/models/lstm/'

    def get_training_filename(self):
        """
        Returns the filename of the training file with the current configuration
        :return:
        """
        return 'training-sequences-' + str(self.trained_width) + '-' + str(self.lines_per_sequence)

    def generate_training_file(self):
        """
        Generates the training data files for the current configuration
        :return:
        """
        # Find all training files
        print('\n\nReading Input Files...')
        input_dir = '../data/raw/dat-files/' + str(self.trained_width) + '/'
        dat_files = [input_dir + filename for filename in os.listdir(input_dir)]

        # Read files and extract sequences
        print('\n\nExtracting data...')
        progress = tf.keras.utils.Progbar(len(dat_files))
        sequences = []
        sequence_length = None
        for i, dat_file in enumerate(dat_files):
            progress.update(i)

            # Read file, normalize, remove option line and add linebreak character
            handler = KnitPaint(dat_file)
            try:
                handler.normalize_bitmap_data(option_line='remove')
                handler.add_char_col(self.linebreak_char)
            except AssertionError:
                continue

            # Get data as numpy, remove padding on top of the Knitpaint, leave one line at bottom
            # (respectively bottom and top of the numpy data)
            dat_data = handler.get_np_bitmap_data()[2:-3, :]

            # Split into sequences, flatten array and remove sequences that have a different length
            # (e.g. last sequence of a file or sequences in files that have a different width by mistake)
            for start in range(0, dat_data.shape[0], self.lines_per_sequence):
                end = start + self.lines_per_sequence
                new_sequence = dat_data[start:end, :].flatten()
                if sequence_length is None:
                    sequence_length = new_sequence.size
                if new_sequence.size == sequence_length:
                    sequences.append(new_sequence)
        sequences = np.array(sequences)

        # Find unique sequences
        sequences, sequences_counts = np.unique(sequences, axis=0, return_counts=True)

        # Extract the vocabulary
        print('\n\nExtracting vocabulary...')
        vocab = np.unique(sequences.flatten())
        vocab.sort()

        # Save sequences and vocabulary
        print('\n\nSaving results...')
        training_filename = self.get_training_filename()
        pathlib.Path(self.training_dir).mkdir(parents=True, exist_ok=True)
        np.save(self.training_dir + training_filename + '.npy', sequences)
        np.save(self.training_dir + training_filename + '-weights.npy', sequences_counts)
        np.save(self.training_dir + training_filename + '-vocab.npy', vocab)

    def read_vocab(self):
        """
        Reads the vocabulary from previously generated training files
        :return:
        """
        # Read vocabulary
        training_filename = self.get_training_filename()
        vocab = np.load(self.training_dir + training_filename + '-vocab.npy')

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
        training_filename = self.get_training_filename()
        sequences = np.load(self.training_dir + training_filename + '.npy')
        weights = np.load(self.training_dir + training_filename + '-weights.npy')

        # Read vocabulary
        vocab, from_idx, to_idx = self.read_vocab()
        vocab_size = vocab.size

        # Transform sequences to index representation
        sequences = to_idx[sequences]

        # Split into inputs and outputs
        input_data = [sequences[:, :-1]]
        output_data = [sequences[:, 1:]]

        return input_data, output_data, weights, vocab_size, from_idx, to_idx

    def get_model(self, vocab_size, batch_shape, stateful=False, softmax=True):
        """
        Returns the model used for training and sampling

        :param vocab_size:
        Size of the vocabulary. This determines the dimensions of the embedding layer

        :param batch_shape:
        Array of batch input shapes. This implementation only uses only the first dimension for the embedding and should
        be (batch_size, max_sequence_length). Subclasses could have additional shapes.

        :param stateful:
        Set to true to make recurrent cells stateful

        :param softmax:
        Set to true to apply the softmax funtion to the output

        :return:
        """
        # Build the model. Start with Input and Embedding
        inputs_layer = keras.layers.Input(batch_shape=batch_shape[0], name='inputs_layer')
        embedded_inputs = keras.layers.Embedding(vocab_size, 30, name='embedded_inputs')(inputs_layer)

        # Add 3 lstm-layers with dropout in between
        if tf.test.is_gpu_available():
            lstm_layer = tf.keras.layers.CuDNNLSTM
        else:
            lstm_layer = functools.partial(tf.keras.layers.LSTM, activation='tanh', recurrent_activation='sigmoid')

        lstm_1 = lstm_layer(500, return_sequences=True, recurrent_initializer='glorot_uniform',
                            stateful=stateful, name='lstm_1')(embedded_inputs)
        dropout_1 = tf.keras.layers.Dropout(0.3, name='dropout_1')(lstm_1)
        lstm_2 = lstm_layer(500, return_sequences=True, recurrent_initializer='glorot_uniform',
                            stateful=stateful, name='lstm_2')(dropout_1)
        dropout_2 = tf.keras.layers.Dropout(0.3, name='dropout_2')(lstm_2)
        lstm_3 = lstm_layer(500, return_sequences=True, recurrent_initializer='glorot_uniform',
                            stateful=stateful, name='lstm_3')(dropout_2)
        dropout_3 = tf.keras.layers.Dropout(0.3, name='dropout_3')(lstm_3)

        # Dense output: One element for each color number in the vocabulary
        activation = 'softmax' if softmax else None
        dense_output = keras.layers.Dense(vocab_size, name='dense_output', activation=activation)(dropout_3)
        model = keras.Model(inputs=inputs_layer, outputs=dense_output)
        return model

    def train(self, val_split=0.05, use_weights=False, metrics=None):
        """
        Trains a model by reading the previously generated training data files

        :param val_split:
        Fraction of data to use as validation set

        :param use_weights:
        Set to true to use weight data in the loss function

        :param metrics:
        List of metrics to use. The default is accuracy.

        :return:
        """
        metrics = ['accuracy'] if metrics is None else metrics

        # Read input and output data
        input_data, output_data, weights, vocab_size, _, _ = self.read_training_dataset()
        output_data = tf.keras.utils.to_categorical(output_data, vocab_size)

        # Bring weights into correct format
        if not use_weights:
            weights = np.ones_like(weights)
        if len(weights.shape) == 2:
            weights = weights[:, -output_data[0].shape[1]:]

        # Shuffle and split data manually into train and test to make sure that the batch size is correct
        train_input_data, train_output_data, train_weights, val_input_data, val_output_data, val_weights = \
            split_train_val(input_data, output_data, weights, self.batch_size, val_split)

        # Get the model
        model = self.get_model(vocab_size, [(self.batch_size, *i.shape[1:]) for i in input_data])

        # Compile the model
        model.compile(optimizer=tf.train.AdamOptimizer(),
                      sample_weight_mode='temporal' if len(weights.shape) == 2 else None,
                      loss='categorical_crossentropy', metrics=metrics)
        model.summary()

        # Fit the data. Use Tensorboard to visualize the progress
        fit_and_log(model, self.model_dir, model_name='lstm-model',
                    x=train_input_data, y=train_output_data, sample_weight=train_weights,
                    validation_data=(val_input_data, val_output_data, val_weights),
                    batch_size=self.batch_size, epochs=self.epochs, shuffle=True)

    def get_static_knitting_pattern_rules(self):
        """
        Builds a numpy array of static column wise knitting rules to be applied during the sampling
        :return:
        """
        # Load vocabulary
        vocab, from_idx, to_idx = self.read_vocab()

        # Define rules
        rules_modulo = self.trained_width + 7
        rules_positive = {
            # First three pixels in a line should be black
            0: [0],
            1: [0],
            2: [0],

            # Knitting data is enclosed by auto yarn feeder points
            3: [0, 13, 99],
            (rules_modulo - 5): [0, 13, 99],

            # Last three pixels in a line should be black
            (rules_modulo - 4): [0],
            (rules_modulo - 3): [0],
            (rules_modulo - 2): [0],

            # Only linebreaks at the end
            (rules_modulo - 1): [151]
        }
        rules_negative = {
            # No tucking and no auto yarn feeder points at the first and last stitch
            4: [11, 12, 171, 172, 41, 42, 88, 13, 99],
            (rules_modulo - 6): [11, 12, 171, 172, 41, 42, 88, 13, 99]
        }
        # No Auto yarn feeder points in the pattern
        for i in range(5, (rules_modulo - 6)):
            rules_negative[i] = [13]

        # Build rule tensors
        rules = []
        for i in range(0, rules_modulo):
            ignore = float("-inf")
            rule = [0.] * vocab.size
            if i in rules_positive:
                rule = [ignore] * vocab.size
                for char in rules_positive[i]:
                    if char in vocab:
                        rule[to_idx[char]] = 0.
            if i in rules_negative:
                for char in rules_negative[i]:
                    if char in vocab:
                        rule[to_idx[char]] = ignore
            rules.append(rule)
        rules = np.array(rules)
        return rules_modulo, rules

    def sample(self, additional_batch_shape=None):
        additional_batch_shape = [] if additional_batch_shape is None else additional_batch_shape

        # Get a reference to the default tensorflow graph
        graph = tf.get_default_graph()

        # Load the vocabulary
        vocab, from_idx, to_idx = self.read_vocab()

        # Build a new model and load just the weights but use a batch-size and sequence-length different from the
        # training without softmax output. This allows the prediction of sequences of any size. Additionally no CUDA
        # is needed for the sampling. Note that the RNN layers need to be stateful so Keras does not reset the state
        # after every batch.
        model = self.get_model(vocab.size, [(1, None)] + additional_batch_shape, stateful=True, softmax=False)
        model.load_weights(self.model_dir + 'lstm-model.h5')
        model.summary()

        # Build a graph to pick a prediction from the logits returned by the RNN
        # This graph adds some basic syntax rules and picks randomly from the probabilities
        model_output = tf.placeholder(tf.float32, shape=(1, None, vocab.size))
        logits = tf.squeeze(model_output, 0)
        temp = tf.placeholder(tf.float32)
        logits_scaled = tf.div(logits, temp)

        # Use rules only if the trained width is set
        index = tf.placeholder(tf.int32)
        if self.trained_width is not None:
            rules_modulo, rules = self.get_static_knitting_pattern_rules()
            rules = tf.constant(rules, dtype=tf.float32)
            rules_modulo = tf.constant(rules_modulo)
            column = tf.mod(index, rules_modulo)
            rule = tf.gather(rules, column)
            logits_ruled = tf.add(logits_scaled, rule)
            prediction = tf.multinomial(logits_ruled, num_samples=1)[-1, 0]
        else:
            prediction = tf.multinomial(logits_scaled, num_samples=1)[-1, 0]

        # Define and return a method that performs the sampling on the loaded model and graph
        def do_sampling(start_string, temperature=1.0, num_generate=100, additional_inputs=None):
            additional_inputs = [] if additional_inputs is None else additional_inputs

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
                    model_input = [np.array([generated[:-1]])] + additional_inputs
                    model.predict(model_input)

                # Now generate by constantly feeding the last generated index and predicting the next
                for i in range(len(start_string), num_generate):
                    try:
                        model_input_idx = generated[-1]
                        model_input = [np.array([[model_input_idx]])] + additional_inputs
                        output = model.predict(model_input)

                        # Pick with multinomial distribution to get a single prediction
                        predicted_idx = sess.run(prediction, feed_dict={model_output: output, index: i, temp: temperature})

                        # Append and yield prediction
                        generated.append(predicted_idx)
                        yield bytes([from_idx[predicted_idx]])
                    except GeneratorExit:
                        return

        return do_sampling


if __name__ == '__main__':
    lstm_model = LSTMModel()

    if sys.argv[1] == 'generate-training-file':
        print('Generating training file...')
        lstm_model.generate_training_file()
    elif sys.argv[1] == 'train':
        print('Training...')
        lstm_model.train(use_weights=False)
    elif sys.argv[1] == 'sample':
        print('Sampling...')
        line = [0]*3 + [13] + [1, 2]*24 + [13] + [0]*3 + [51]
        start = line*4
        for test in lstm_model.sample()(start, temperature=0.01, num_generate=400):
            print('Sampled: ' + str(test))

    print('Done!')
