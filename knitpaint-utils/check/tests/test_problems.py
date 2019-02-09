import pytest
import numpy as np
from ... import KnitPaint
from ..problems import *
from ... import check


def make_knitpaint(input_list):
    """
    Helper method to create knitpaint from a 2d list or array
    :param input_list:
    :return:
    """
    return KnitPaint(np.flipud(np.array(input_list)))


def test_loops_in_needle_warn_by_tuck():
    input_pattern = make_knitpaint([[1, 11, 1],
                                    [1, 11, 1],
                                    [1, 1,  1]])
    with pytest.raises(KnitPaintCheckException) as err:
        check(input_pattern)
    problems = err.value.problems
    assert len(problems) == 1
    assert isinstance(problems[0], NumberOfLoopsInNeedleWarning)
    assert problems[0].course == 2
    assert problems[0].wale == 1


def test_loops_in_needle_error_by_tuck():
    input_pattern = make_knitpaint([[1, 11, 1],
                                    [1, 11, 1],
                                    [1, 11, 1],
                                    [1, 1,  1]])
    with pytest.raises(KnitPaintCheckException) as err:
        check(input_pattern)
    problems = err.value.problems
    assert len(problems) == 2
    assert isinstance(problems[1], NumberOfLoopsInNeedleError)
    assert problems[1].course == 3
    assert problems[1].wale == 1


def test_loops_in_needle_warn_by_move():
    input_pattern = make_knitpaint([[7, 1, 6]])
    with pytest.raises(KnitPaintCheckException) as err:
        check(input_pattern)
    problems = err.value.problems
    assert len(problems) == 1
    assert isinstance(problems[0], NumberOfLoopsInNeedleWarning)
    assert problems[0].course == 0
    assert problems[0].wale == 1


def test_loops_in_needle_error_by_move():
    input_pattern = make_knitpaint([[72, 7, 1, 6]])
    with pytest.raises(KnitPaintCheckException) as err:
        check(input_pattern)
    problems = err.value.problems
    assert len(problems) == 1
    assert isinstance(problems[0], NumberOfLoopsInNeedleError)
    assert problems[0].course == 0
    assert problems[0].wale == 2


def test_loops_in_needle_warn_combined():
    input_pattern = make_knitpaint([[1, 11, 1],
                                    [1, 1,  6]])
    with pytest.raises(KnitPaintCheckException) as err:
        check(input_pattern)
    problems = err.value.problems
    assert len(problems) == 1
    assert isinstance(problems[0], NumberOfLoopsInNeedleWarning)
    assert problems[0].course == 1
    assert problems[0].wale == 1


def test_loops_in_needle_error_combined():
    input_pattern = make_knitpaint([[1, 11, 1],
                                    [7, 1,  6]])
    with pytest.raises(KnitPaintCheckException) as err:
        check(input_pattern)
    problems = err.value.problems
    assert len(problems) == 2
    assert isinstance(problems[1], NumberOfLoopsInNeedleError)
    assert problems[1].course == 1
    assert problems[1].wale == 1


def test_hold_error_by_miss():
    input_pattern = make_knitpaint([[1, 1,  1],
                                    *[[1, 16, 1]] * 7,
                                    [1, 1,  1]])
    with pytest.raises(KnitPaintCheckException) as err:
        check(input_pattern)
    problems = err.value.problems
    assert len(problems) == 1
    assert isinstance(problems[0], LoopHoldError)
    assert problems[0].course == 8
    assert problems[0].wale == 1


def test_max_rack_warn_by_move():
    input_pattern = make_knitpaint([[1, 73, 1, 62, 1]])
    with pytest.raises(KnitPaintCheckException) as err:
        check(input_pattern)
    problems = err.value.problems
    assert len(problems) == 1
    assert isinstance(problems[0], RackingWarning)
    assert problems[0].course == 0
    assert problems[0].wale == 1


def test_max_rack_error_by_move():
    input_pattern = make_knitpaint([[1, 73, 1, 63, 1]])
    with pytest.raises(KnitPaintCheckException) as err:
        check(input_pattern)
    problems = err.value.problems
    assert len(problems) == 1
    assert isinstance(problems[0], RackingError)
    assert problems[0].course == 0
    assert problems[0].wale == 1


def test_continuous_pickup_1():
    input_pattern = make_knitpaint([[1, 1, 1, 1],
                                    [1, 1, 1, 1],
                                    [1, 6, 7, 1]])
    with pytest.raises(KnitPaintCheckException) as err:
        check(input_pattern)
    problems = err.value.problems
    assert len(problems) > 0
    assert isinstance(problems[0], ContinuousPickupStitchWarning)


def test_no_continuous_pickup_1_1():
    input_pattern = make_knitpaint([[1, 1,  1, 1],
                                    [1, 16, 1, 1],
                                    [1, 6,  7, 1]])
    # No exception should be thrown
    check(input_pattern)


def test_no_continuous_pickup_1_2():
    input_pattern = make_knitpaint([[1, 1, 1,  1],
                                    [1, 1, 16, 1],
                                    [1, 6, 7,  1]])
    # No exception should be thrown
    check(input_pattern)


def test_continuous_pickup_2_1():
    input_pattern = make_knitpaint([[1, 1, 1,  1,  1, 1],
                                    [1, 1, 1,  1,  1, 1],
                                    [1, 6, 72, 72, 1, 1]])
    with pytest.raises(KnitPaintCheckException) as err:
        check(input_pattern)
    problems = err.value.problems
    assert len(problems) > 0
    assert isinstance(problems[0], ContinuousPickupStitchWarning)


def test_continuous_pickup_2_2():
    input_pattern = make_knitpaint([[1, 1, 1,  1,  1, 1],
                                    [1, 1, 16, 1,  1, 1],
                                    [1, 1, 16, 1,  1, 1],
                                    [1, 6, 72, 72, 1, 1]])
    with pytest.raises(KnitPaintCheckException) as err:
        check(input_pattern)
    problems = err.value.problems
    assert len(problems) > 0
    assert isinstance(problems[0], ContinuousPickupStitchWarning)


def test_continuous_pickup_2_3():
    input_pattern = make_knitpaint([[1, 1, 1,  1,  1, 1],
                                    [1, 1, 11, 1,  1, 1],
                                    [1, 6, 72, 72, 1, 1]])
    with pytest.raises(KnitPaintCheckException) as err:
        check(input_pattern)
    problems = err.value.problems
    assert len(problems) > 0
    assert isinstance(problems[0], ContinuousPickupStitchWarning)


def test_no_continuous_pickup_2_1():
    input_pattern = make_knitpaint([[1, 1, 1,  1,  1, 1],
                                    [1, 1, 1,  1,  1, 1],
                                    [1, 1, 16, 1,  1, 1],
                                    [1, 6, 72, 72, 1, 1]])
    # No exception should ne thrown
    check(input_pattern)


def test_no_continuous_pickup_2_2():
    input_pattern = make_knitpaint([[1, 1, 1,  1,  1, 1],
                                    [1, 1, 16, 1,  1, 1],
                                    [1, 1, 1,  1,  1, 1],
                                    [1, 6, 72, 72, 1, 1]])
    # No exception should ne thrown
    check(input_pattern)


def test_no_continuous_pickup_2_3():
    input_pattern = make_knitpaint([[1, 1, 1,  1,  1, 1],
                                    [1, 1, 11, 1,  1, 1],
                                    [1, 1, 1,  1,  1, 1],
                                    [1, 6, 72, 72, 1, 1]])
    # No exception should ne thrown
    check(input_pattern)


def test_continuous_pickup_3():
    input_pattern = make_knitpaint([[1, 1,  1,  1],
                                    [1, 1,  1,  1],
                                    [1, 16, 16, 1],
                                    [1, 6,  7,  1]])
    with pytest.raises(KnitPaintCheckException) as err:
        check(input_pattern)
    problems = err.value.problems
    assert len(problems) > 0
    assert isinstance(problems[0], ContinuousPickupStitchWarning)


def test_no_continuous_pickup_3():
    input_pattern = make_knitpaint([[1, 1,  1,  1],
                                    [1, 16, 1,  1],
                                    [1, 16, 16, 1],
                                    [1, 6,  7,  1]])
    # No exception should ne thrown
    check(input_pattern)


def test_continuous_pickup_4():
    input_pattern = make_knitpaint([[1, 1, 1, 1],
                                    [1, 2, 2, 1],
                                    [1, 2, 1, 1],
                                    [1, 1, 2, 1],
                                    [1, 6, 7, 1]])
    with pytest.raises(KnitPaintCheckException) as err:
        check(input_pattern)
    problems = err.value.problems
    assert len(problems) > 0
    assert isinstance(problems[0], ContinuousPickupStitchWarning)


def test_no_continuous_pickup_4():
    input_pattern = make_knitpaint([[1, 1,  1,  1],
                                    [1, 2,  2,  1],
                                    [1, 52, 51, 1],
                                    [1, 51, 52, 1],
                                    [1, 6,  7,  1]])
    # No exception should ne thrown
    check(input_pattern)


def test_continuous_pickup_5():
    input_pattern = make_knitpaint([[2, 2,  2,  2],
                                    [2, 2,  2,  2],
                                    [1, 51, 51, 1]])
    with pytest.raises(KnitPaintCheckException) as err:
        check(input_pattern)
    problems = err.value.problems
    assert len(problems) > 0
    assert isinstance(problems[0], ContinuousPickupStitchWarning)


def test_no_continuous_pickup_5():
    input_pattern = make_knitpaint([[1, 1,  1,  1],
                                    [1, 1,  1,  1],
                                    [1, 51, 51, 1]])
    # No exception should be thrown
    check(input_pattern)


def test_no_continuous_pickup_6():
    input_pattern = make_knitpaint([[1, 1,  1,  1],
                                    [1, 11, 11, 1],
                                    [1, 1,  1,  1]])
    # No exception should be thrown
    check(input_pattern)
