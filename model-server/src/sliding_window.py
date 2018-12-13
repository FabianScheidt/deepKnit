import numpy as np
import tensorflow as tf
import tensorflow.keras as keras
import pathlib, sys, datetime, os, random
from KnitPaintFileHandler import KnitPaintFileHandler
from TensorBoardLogger import TensorBoardLogger


class SlidingWindowModel:
    # Define window
    window_shape = (5, 9)
    batch_size = 8192
    epochs = 1000
    training_dir = '../data/processed/training-files/sliding-window/'
    model_dir = '../output/models/sliding-window/'

    def __init__(self, window_shape=None):
        if window_shape is not None:
            self.window_shape = window_shape

    def get_training_filename(self):
        return 'training-windows-' + str(self.window_shape[0]) + '-' + str(self.window_shape[1])

    def sliding_window(self, image):
        """
        Extracts all possible slices from an image by sliding a crop window across it.
        :param image:
        :return:
        """
        max_y = image.shape[0] - self.window_shape[0] + 1
        max_x = image.shape[1] - self.window_shape[1] + 1
        for y in range(0, max_y):
            for x in range(0, max_x):
                yield image[y:y + self.window_shape[0], x:x + self.window_shape[1]]

    def generate_training_file(self):
        # Check window dimensions
        assert self.window_shape[0] > 0 and self.window_shape[1] > 0, 'Window shape should be positive'
        assert self.window_shape[1] % 2 == 1, 'Window width should be odd'

        # Find all training files
        print('\n\nReading Input Files...')
        input_dirs = [
            '../data/raw/dat-files/50/',
            '../data/raw/dat-files/400/'
        ]
        dat_files = []
        for input_dir in input_dirs:
            dat_files = dat_files + [input_dir + filename for filename in os.listdir(input_dir)]

        # Shuffle list of files for more accurate progress bar since files have different sizes
        random.shuffle(dat_files)

        # Read files and extract window
        print('\n\nExtracting data...')
        progress = tf.keras.utils.Progbar(len(dat_files))
        training_windows = []
        for i, dat_file in enumerate(dat_files):
            progress.update(i)

            # Read file, get data as numpy, remove padding on all sides
            handler = KnitPaintFileHandler(dat_file)
            try:
                handler.normalize_bitmap_data(option_line='remove')
            except AssertionError:
                continue
            dat_data = handler.get_np_bitmap_data()[3:-3, 3:-3]

            # Add padding on left and right with the width of the window
            padding = np.zeros((dat_data.shape[0], self.window_shape[1]), dtype=int)
            dat_data = np.hstack((padding, dat_data, padding))
            training_windows = training_windows + list(self.sliding_window(dat_data))
        training_windows = np.array(training_windows)

        # Find unique pattern
        print('\n\nMaking data unique...')
        training_windows, training_windows_counts = np.unique(training_windows, axis=0, return_counts=True)

        # Extract the vocabulary
        print('\n\nExtracting vocabulary...')
        vocab = np.unique(training_windows.flatten())
        vocab.sort()

        # Save windows and vocabulary
        print('\n\nSaving results...')
        training_filename = self.get_training_filename()
        pathlib.Path(self.training_dir).mkdir(parents=True, exist_ok=True)
        np.save(self.training_dir + training_filename + '.npy', training_windows)
        np.save(self.training_dir + training_filename + '-counts.npy', training_windows_counts)
        np.save(self.training_dir + 'vocab.npy', vocab)

    def read_vocab(self):
        # Read vocabulary
        vocab = np.load(self.training_dir + 'vocab.npy')

        # Build lookups
        to_idx = np.zeros(256, dtype=int)
        from_idx = np.zeros(256, dtype=int)
        for idx, data in enumerate(np.nditer(vocab)):
            to_idx[data] = idx
            from_idx[idx] = data

        return vocab, from_idx, to_idx

    def read_training_dataset(self):
        # Read window data
        training_filename = self.get_training_filename()
        window_data = np.load(self.training_dir + training_filename + '.npy')
        counts = np.load(self.training_dir + training_filename + '-counts.npy')
        assert window_data[1].shape == self.window_shape, 'Shape of loaded file does not match current window'

        # Generate inputs and outputs
        output_x = self.window_shape[1] // 2
        output_data = window_data[:, 0, output_x]
        input_data = np.copy(window_data)
        input_data[:, 0, output_x:] = 0
        del window_data

        # Read vocabulary
        vocab, from_idx, to_idx = self.read_vocab()
        vocab_size = vocab.size

        # Transform input and output to index representation
        input_data = to_idx[input_data]
        output_data = to_idx[output_data]

        return input_data, output_data, counts, vocab_size, from_idx, to_idx

    def get_model(self, vocab_size, batch_shape, softmax=True):
        # Start with Input and Embedding
        inputs_layer = keras.layers.Input(batch_shape=batch_shape, name='inputs_layer')
        embedded_inputs = keras.layers.Embedding(vocab_size, 5, name='embedded_inputs')(inputs_layer)

        # Convolutional...
        # upsampling_1 = keras.layers.UpSampling2D(name='upsampling_1')(embedded_inputs)
        # conv_1 = keras.layers.Conv2D(32, 3, 1, activation='relu', name='conv_1', padding='same')(upsampling_1)
        # conv_2 = keras.layers.Conv2D(32, 3, 1, activation='relu', name='conv_2', padding='same')(conv_1)
        # # pooling_1 = keras.layers.MaxPool2D(pool_size=(2, 2), name='pooling_1')(conv_2)
        # # conv_3 = keras.layers.Conv2D(8, 3, 1, activation='relu', name='conv_3', padding='same')(pooling_1)
        # dropout_1 = keras.layers.Dropout(0.2, name='dropout_1')(conv_2)
        # flatten = keras.layers.Flatten(name='flatten')(dropout_1)

        # Fully Connected
        flatten = keras.layers.Flatten(name='flatten')(embedded_inputs)
        dense_1 = keras.layers.Dense(1000, activation='relu', name='dense_1')(flatten)
        dropout_1 = keras.layers.Dropout(0.2, name='dropout_1')(dense_1)
        dense_2 = keras.layers.Dense(250, activation='relu', name='dense_2')(dropout_1)
        dropout_2 = keras.layers.Dropout(0.2, name='dropout_2')(dense_2)
        dense_3 = keras.layers.Dense(250, activation='relu', name='dense_3')(dropout_2)
        dropout_3 = keras.layers.Dropout(0.2, name='dropout_3')(dense_3)

        # Output
        activation = 'softmax' if softmax else None
        dense_output = keras.layers.Dense(vocab_size, name='dense_output', activation=activation)(dropout_3)
        model = keras.Model(inputs=inputs_layer, outputs=dense_output)
        return model

    def train(self, val_split=0.05):
        # Read input and output data
        input_data, output_data, _, vocab_size, _, _ = self.read_training_dataset()
        output_data = tf.keras.utils.to_categorical(output_data, vocab_size)

        # Get the model
        model = self.get_model(vocab_size, (None, *input_data.shape[1:]), True)

        # Compile the model. Use sparse categorical crossentropy so we don't need one hot output vectors
        # When not using eager execution, the target shape needs to be defined explicitly using a custom placeholder
        model.compile(optimizer=tf.train.AdamOptimizer(),
                      loss='categorical_crossentropy', metrics=['accuracy'])
        model.summary()

        # Fit the data. Use Tensorboard to visualize the progress
        try:
            log_date_str = datetime.datetime.now().strftime('%Y-%m-%d-%H-%M-%S')
            log_dir = '../tensorboard-log/{}'.format(log_date_str)
            tensor_board_logger = TensorBoardLogger(write_graph=True, log_dir=log_dir)
            model.fit(input_data, output_data, validation_split=val_split, batch_size=self.batch_size,
                      epochs=self.epochs, callbacks=[tensor_board_logger], shuffle=True)
        except KeyboardInterrupt:
            print('Saving current state of model...')
            pathlib.Path(self.model_dir).mkdir(parents=True, exist_ok=True)
            model.save(self.model_dir + 'sliding-window-model-interrupted.h5')
            raise

        pathlib.Path(self.model_dir).mkdir(parents=True, exist_ok=True)
        model.save(self.model_dir + 'sliding-window-model.h5')

    def sample(self, width, start_string, temperature, num_generate):

        # Immediately return the start string
        for char in start_string:
            yield bytes([char])

        # Add black lines at beginning to allow predictions for any start size
        start_string = [0] * width * self.window_shape[0] + start_string

        # Create a tensorflow session
        sess = tf.Session()
        with sess.as_default():

            # Load vocabulary and the trained model
            vocab, from_idx, to_idx = self.read_vocab()
            loaded_model = keras.models.load_model(self.model_dir + 'sliding-window-model.h5')
            loaded_weights = loaded_model.get_weights()

            # Copy weights into new model that does not use the softmax output
            model = self.get_model(vocab.size, (1, *self.window_shape), False)
            model.set_weights(loaded_weights)
            model.summary()

            # Build a graph to pick a prediction from the logits returned by the RNN
            model_output = tf.placeholder(tf.float32, shape=(1, vocab.size))
            temperature = tf.constant(temperature, dtype=tf.float32)
            logits_scaled = tf.div(model_output, temperature)
            prediction = tf.multinomial(logits_scaled, num_samples=1)[-1, 0]

            # Keep a record of the generated bytes
            generated = [to_idx[s] for s in start_string]

            print('Generating')
            for i in range(len(start_string) - width * self.window_shape[0], num_generate):
                # Edges should be 0
                if 0 <= (len(generated) + self.window_shape[1] // 2) % width < self.window_shape[1] - 1:
                    predicted_idx = to_idx[0]

                # Use model everywhere else
                else:
                    num_generated = len(generated)
                    generated_np = np.array(generated)
                    generated_np.resize((num_generated // width + 1, width), refcheck=False)
                    generated_np = np.flipud(generated_np)

                    y_start = 0
                    y_end = self.window_shape[0]
                    x_start = (num_generated % width) - (self.window_shape[1] // 2)
                    x_end = x_start + self.window_shape[1]
                    prediction_input = generated_np[y_start:y_end, x_start:x_end]
                    prediction_input = prediction_input.reshape((1, *prediction_input.shape))
                    prediction_output = model.predict(prediction_input)
                    predicted_idx = sess.run(prediction, feed_dict={model_output: prediction_output})

                generated.append(predicted_idx)
                yield bytes([from_idx[predicted_idx]])


if __name__ == '__main__':
    sliding_window_model = SlidingWindowModel()

    if sys.argv[1] == 'generate-training-file':
        print('Generating training file...')
        sliding_window_model.generate_training_file()
    elif sys.argv[1] == 'train':
        print('Training...')
        sliding_window_model.train()
    elif sys.argv[1] == 'sample':
        print('Sampling...')
        line = [0]*4 + [13] + [1, 2]*24 + [13] + [0]*4
        start = line*4
        for test in sliding_window_model.sample(58, start, 0.01, 400):
            print('Sampled: ' + str(test))

    print('Done!')
