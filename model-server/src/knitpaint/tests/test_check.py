import pytest
import numpy as np
from .. import KnitPaint
from ..check import KnitpaintCheckException, TransferOutOfBedError, ContinuousPickupStitchWarning


def test_correct_check():
    input_pattern = np.array([[1, 1], [1, 1]])
    knitpaint = KnitPaint(input_pattern)

    # No error should be thrown
    loops = knitpaint.check()
    assert len(loops) > 0


def test_incorrect_check():
    input_pattern = np.array([[1, 1], [6, 1]])
    knitpaint = KnitPaint(input_pattern)
    with pytest.raises(KnitpaintCheckException) as err:
        knitpaint.check()
    problems = err.value.problems
    assert isinstance(problems[0], TransferOutOfBedError)


def test_correct_pattern_check():
    input_pattern = np.array([[1, 1], [6, 1]])
    knitpaint = KnitPaint(input_pattern)

    # No error should be thrown
    loops = knitpaint.check_as_pattern()
    assert len(loops) > 0


def test_incorrect_pattern_check():
    input_pattern = np.array([[1, 1, 1, 1], [1, 1, 1, 1], [1, 6, 7, 1]])
    knitpaint = KnitPaint(input_pattern)
    with pytest.raises(KnitpaintCheckException) as err:
        knitpaint.check_as_pattern()
    problems = err.value.problems
    assert isinstance(problems[0], ContinuousPickupStitchWarning)
