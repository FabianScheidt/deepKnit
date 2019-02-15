import pytest
from .make_knitpaint import make_knitpaint
from ..problems import *
from ... import check_pattern


def test_correct():
    input_pattern = make_knitpaint([[1, 1], [1, 1]])

    # No error should be thrown
    loops = check_pattern(input_pattern)
    assert len(loops) > 0


def test_incorrect_miss():
    input_pattern = make_knitpaint([[1, 16, 1], [1, 16, 1]])

    # A repeated miss should throw an error
    with pytest.raises(KnitPaintCheckException) as err:
        check_pattern(input_pattern)
    problems = err.value.problems
    assert len(problems) > 0
    assert isinstance(problems[0], LoopHoldError)
