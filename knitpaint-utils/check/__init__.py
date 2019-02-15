from typing import List
import numpy as np
from .loop import Loop
from .virtual_knitting_machine import VirtualKnittingMachine
from .cable_resolution import resolve_cable_stitches
from .problems import *


def check(knitpaint) -> List[Loop]:
    """
    Checks the provided knitpaint by virtually performing the actual knitting. Raises a KnitpaintCheckException
    containing a list of problems that occurred. Returns a list of loop if no problems occurred
    :param knitpaint:
    :return:
    """
    data = knitpaint.bitmap_data[:]
    num_wales = knitpaint.get_width()

    # Replace cable stitches with move stitches for further checking
    processed_data = resolve_cable_stitches(data, num_wales)

    # Create a virtual knitting machine and make it knit the processed data
    knitting_machine = VirtualKnittingMachine(num_wales)
    return knitting_machine.run(processed_data, num_wales)


def check_pattern(knitpaint) -> List[Loop]:
    """
    Checks if the provided knitpaint can be knitted by tiling it and surrounding it with single jersey stitches.
    Raises a KnitpaintCheckException containing a list of problems that occurred. Returns a list of loop if no
    problems occurred
    :param knitpaint:
    :return:
    """
    bitmap = knitpaint.get_np_bitmap_data()
    tiled = np.tile(bitmap, (2, 2))
    padded = np.pad(tiled, ((2, 2), (7, 7)), 'constant', constant_values=((1, 1), (1, 1)))
    from .. import KnitPaint
    return check(KnitPaint(padded))
