import tensorflow as tf
from tensorflow.keras.callbacks import TensorBoard


class TensorBoardLogger(TensorBoard):
    def __init__(self, log_every=1, validate_every=-1, **kwargs):
        super().__init__(**kwargs)
        self.log_every = log_every
        self.validate_every = validate_every
        self.counter = 0

    def on_batch_end(self, batch, logs=None):
        self.counter += 1
        new_logs = False

        if self.counter % self.log_every == 0:
            new_logs = True

            # Log existing metrics
            for name, value in logs.items():
                if name in ['batch', 'size']:
                    continue
                summary = tf.Summary()
                summary_value = summary.value.add()
                summary_value.simple_value = value.item()
                summary_value.tag = name
                self.writer.add_summary(summary, self.counter)

        if self.validate_every > 0 and self.counter % self.validate_every == 0:
            new_logs = True

            # Validation metrics and log them
            val_metrics = self.model.evaluate(self.validation_data[0], self.validation_data[1], verbose=0)

            for i, metric_name in enumerate(self.model.metrics_names):
                summary = tf.Summary()
                summary_value = summary.value.add()
                summary_value.simple_value = val_metrics[i]
                summary_value.tag = 'val_' + metric_name
                self.writer.add_summary(summary, self.counter)

        if new_logs:
            self.writer.flush()

    def on_epoch_end(self, epoch, logs=None):
        for name, value in logs.items():
            if name in ['acc', 'loss', 'batch', 'size']:
                continue
            summary = tf.Summary()
            summary_value = summary.value.add()
            summary_value.simple_value = value.item()
            summary_value.tag = name
            self.writer.add_summary(summary, self.counter)
        self.writer.flush()
