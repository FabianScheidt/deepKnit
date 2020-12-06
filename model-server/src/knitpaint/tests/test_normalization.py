import numpy as np
from .. import KnitPaint


def test_cropping():
    # Generate random knitpaint and add even and random padding around it
    random = np.random.randint(1, 255, (100, 100))
    even_padding_shape = np.ones((2, 2), dtype=int) * 3
    random_padded_even = np.pad(random, even_padding_shape, 'constant', constant_values=((0, 0), (0, 0)))
    random_padding_shape = np.random.randint(5, 20, (2, 2))
    random_padded_random = np.pad(random, random_padding_shape, 'constant', constant_values=((0, 0), (0, 0)))

    # Perform normalization and check if cropping worked as expected
    kp_random = KnitPaint(random_padded_random)
    kp_random.normalize_bitmap_data(has_option_line=False, option_line='remove')
    normalized = kp_random.get_np_bitmap_data()
    assert np.array_equal(normalized, random_padded_even), 'Expected KnitPaint to be normalized'


def test_default_option_line():
    random = np.random.randint(1, 255, (100, 100))
    kp_random = KnitPaint(random)
    kp_random.normalize_bitmap_data(has_option_line=False, option_line='default')
    normalized = kp_random.get_np_bitmap_data()

    assert np.array_equal(normalized[3:-3, 45:-45], random), 'Expected pattern not to be changed'
    assert normalized.shape == (106, 190), 'Expected option line to have correct shape'
