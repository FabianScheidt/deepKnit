import numpy as np
import tensorflow as tf
import tensorflow.keras as keras
import pathlib, sys, datetime, os
from KnitPaintFileHandler import KnitPaintFileHandler
from TensorBoardLogger import TensorBoardLogger


class LSTMModel:
    trained_width = 50
    linebreak_char = 151
    lines_per_sequence = 4
    batch_size = 32
    epochs = 100
    training_dir = '../data/processed/training-files/lstm/'
    model_dir = '../output/models/lstm/'

    def get_training_filename(self):
        return 'training-sequences-' + str(self.trained_width) + '-' + str(self.lines_per_sequence)

    def generate_training_file(self):
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
            handler = KnitPaintFileHandler(dat_file)
            try:
                handler.normalize_bitmap_data(remove_option_line=True)
                handler.add_char_col(self.linebreak_char)
            except AssertionError:
                continue

            # Get data as numpy, remove padding on top of the Knitpaint, leave on line at bottom
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
        np.save(self.training_dir + training_filename + '-counts.npy', sequences_counts)
        np.save(self.training_dir + training_filename + '-vocab.npy', vocab)

    def read_vocab(self):
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

    def read_training_dataset(self, val_split=0.05):
        # Read sequences
        training_filename = self.get_training_filename()
        sequences = np.load(self.training_dir + training_filename + '.npy')

        # Read vocabulary
        vocab, from_idx, to_idx = self.read_vocab()
        vocab_size = vocab.size

        # Transform sequences to index representation
        sequences = to_idx[sequences]

        # Generate dataset with inputs and outputs
        chunks = tf.data.Dataset.from_tensor_slices(sequences)

        def split_input_target(chunk):
            input_text = chunk[:-1]
            target_text = chunk[1:]
            return input_text, target_text

        dataset = chunks.map(split_input_target)
        dataset = dataset.shuffle(10000).batch(self.batch_size, drop_remainder=True)
        dataset_count = sequences.shape[0] // self.batch_size

        # Split dataset into train and validation
        val_count = int(dataset_count * val_split)
        train_count = dataset_count - val_count
        dataset_train = dataset.take(train_count)
        dataset_val = dataset.skip(train_count)

        return dataset_train, train_count, dataset_val, val_count, vocab_size, from_idx, to_idx

    def get_model(self, vocab_size, batch_shape):
        # Build the model. Start with Input and Embedding
        inputs_layer = keras.layers.Input(batch_shape=batch_shape, name='inputs_layer')
        embedded_inputs = keras.layers.Embedding(vocab_size, 30, name='embedded_inputs')(inputs_layer)

        # Add 3 lstm-layers with dropout in between
        if tf.test.is_gpu_available():
            lstm_layer = tf.keras.layers.CuDNNLSTM
        else:
            lstm_layer = tf.keras.layers.LSTM

        lstm_1 = lstm_layer(500, return_sequences=True, recurrent_initializer='glorot_uniform',
                            stateful=True, name='lstm_1')(embedded_inputs)
        dropout_1 = tf.keras.layers.Dropout(0.3, name='dropout_1')(lstm_1)
        lstm_2 = lstm_layer(500, return_sequences=True, recurrent_initializer='glorot_uniform',
                            stateful=True, name='lstm_2')(dropout_1)
        dropout_2 = tf.keras.layers.Dropout(0.3, name='dropout_2')(lstm_2)
        lstm_3 = lstm_layer(500, return_sequences=True, recurrent_initializer='glorot_uniform',
                            stateful=True, name='lstm_3')(dropout_2)
        dropout_3 = tf.keras.layers.Dropout(0.3, name='dropout_3')(lstm_3)

        # Dense output: One element for each color number in the vocabulary
        dense_output = keras.layers.Dense(vocab_size, name='dense_output')(dropout_3)
        model = keras.Model(inputs=inputs_layer, outputs=dense_output)
        return model

    def train(self):
        # Read input and output data
        dataset_train, train_count, dataset_val, val_count, vocab_size, _, _ = self.read_training_dataset()

        # Get the model
        model = self.get_model(vocab_size, dataset_train.output_shapes[0])

        # Define loss and accuracy functions
        def sparse_categorical_loss(labels, logits):
            return tf.nn.sparse_softmax_cross_entropy_with_logits(labels=labels, logits=logits)

        def sparse_categorical_accuracy(labels, logits):
            pred = tf.argmax(logits, axis=-1)
            return tf.keras.metrics.categorical_accuracy(labels, pred)

        # Compile the model. Use sparse categorical crossentropy so we don't need one hot output vectors
        # When not using eager execution, the target shape needs to be defined explicitly using a custom placeholder
        target_placeholder = tf.placeholder(dtype='int32', shape=dataset_train.output_shapes[1])
        model.compile(target_tensors=[target_placeholder], optimizer=tf.train.AdamOptimizer(),
                      loss=sparse_categorical_loss, metrics=[sparse_categorical_accuracy])
        model.summary()

        # Fit the data. Use Tensorboard to visualize the progress
        try:
            log_date_str = datetime.datetime.now().strftime('%Y-%m-%d-%H-%M-%S')
            log_dir = '../tensorboard-log/{}'.format(log_date_str)
            tensor_board_logger = TensorBoardLogger(write_graph=True, log_dir=log_dir)
            model.fit(dataset_train.repeat(), steps_per_epoch=train_count,
                      validation_data=dataset_val.repeat(), validation_steps=val_count,
                      epochs=self.epochs, callbacks=[tensor_board_logger])
        except KeyboardInterrupt:
            print('Saving current state of model...')
            pathlib.Path(self.model_dir).mkdir(parents=True, exist_ok=True)
            model.save(self.model_dir + 'lstm-model-interrupted.h5')
            raise

        pathlib.Path(self.model_dir).mkdir(parents=True, exist_ok=True)
        model.save(self.model_dir + 'lstm-model.h5')

    def get_static_knitting_pattern_rules(self):
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
                    if char in to_idx:
                        rule[to_idx[char]] = 0.
            if i in rules_negative:
                for char in rules_negative[i]:
                    if char in to_idx:
                        rule[to_idx[char]] = ignore
            rules.append(rule)
        rules = np.array(rules)
        return rules_modulo, rules

    def sample(self, start_string, temperature, num_generate):
        # Immediately return the start string
        for char in start_string:
            yield bytes([char])

        # Create a tensorflow session
        sess = tf.Session()
        with sess.as_default():

            # Load vocabulary and the trained model
            vocab, from_idx, to_idx = self.read_vocab()
            loaded_model = keras.models.load_model(self.model_dir + 'lstm-model.h5')
            loaded_weights = loaded_model.get_weights()

            # Build a new model with the same weights but different batch-size and sequence-length
            # This allows the prediction of sequences of any size. Note that the RNN layers need to be stateful
            # so Keras does not reset the state after every batch
            model = self.get_model(vocab.size, (1, 1))
            model.set_weights(loaded_weights)
            model.summary()

            # Build a graph to pick a prediction from the logits returned by the RNN
            # This graph adds some basic syntax rules and picks randomly from the probabilities
            model_output = tf.placeholder(tf.float32, shape=(1, 1, vocab.size))
            logits = tf.squeeze(model_output, 0)
            temperature = tf.constant(temperature, dtype=tf.float32)
            logits_scaled = tf.div(logits, temperature)

            index = tf.placeholder(tf.int32)
            rules_modulo, rules = self.get_static_knitting_pattern_rules()
            rules = tf.constant(rules, dtype=tf.float32)
            rules_modulo = tf.constant(rules_modulo)
            column = tf.mod(index, rules_modulo)
            rule = tf.gather(rules, column)
            logits_ruled = tf.add(logits_scaled, rule)

            prediction = tf.multinomial(logits_ruled, num_samples=1)[-1, 0]

            # Keep a record of the generated bytes
            generated = [to_idx[char] for char in start_string]

            # Feed the start string
            model.reset_states()
            for input_idx in generated[:-1]:
                input = np.array([[input_idx]])
                model.predict(input)

            # Now generate by constantly feeding the last generated index and predicting the next
            print('Generating')
            for i in range(len(start_string), num_generate):
                input_idx = generated[-1]
                input = np.array([[input_idx]])
                output = model.predict(input)

                # Pick with multinomial distribution to get a single prediction
                col, rul, predicted_idx = sess.run([column, rule, prediction], feed_dict={model_output: output, index: i})

                # Append and yield prediction
                generated.append(predicted_idx)
                yield bytes([from_idx[predicted_idx]])


if __name__ == '__main__':
    lstm_model = LSTMModel()

    if sys.argv[1] == 'generate-training-file':
        print('Generating training file...')
        lstm_model.generate_training_file()
    elif sys.argv[1] == 'train':
        print('Training...')
        lstm_model.train()
    elif sys.argv[1] == 'sample':
        print('Sampling...')
        line = [0]*3 + [13] + [1, 2]*24 + [13] + [0]*3 + [51]
        start = line*4
        for test in lstm_model.sample(start, 0.01, 400):
            print('Sampled: ' + str(test))

    print('Done!')
