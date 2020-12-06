import numpy as np
from ... import KnitPaint


def make_knitpaint(input_list):
    """
    Helper method to create knitpaint from a 2d list or array
    :param input_list:
    :return:
    """
    return KnitPaint(np.flipud(np.array(input_list)))