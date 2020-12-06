import numpy as np
from .. import KnitPaint
from .. import read_dat
from .. import read_image


def test_dat_read_write(tmp_path):
    """
    Generates a random knitpaint pattern and writes it to disk. Then checks if the loaded files are the same
    :return:
    """
    random = np.random.randint(0, 255, (100, 100))
    kp_random = KnitPaint(random)

    # Write and read dat
    kp_random.write_dat(str(tmp_path / 'test.dat'))
    kp_dat = read_dat(str(tmp_path / 'test.dat'))
    assert kp_dat == kp_random, 'Expected KnitPaint read from disk to equal the one generated before'


def test_image_read_write(tmp_path):
    """
    Generates a random knitpaint pattern and writes its image to disk. Then checks if the loaded files are the same
    :return:
    """
    # Don't use all available color numbers since some are redundant (e.g. 6 and 61)
    random = np.random.randint(0, 50, (100, 100))
    kp_random = KnitPaint(random)

    # Write and read image
    kp_random.write_image(str(tmp_path / 'test.png'))
    kp_image = read_image(str(tmp_path / 'test.png'))
    assert kp_image == kp_random, 'Expected KnitPaint read from disk to equal the one generated before'
