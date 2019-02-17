import pytest
from .make_knitpaint import make_knitpaint
from ..problems import *
from ... import check


def test_false_yarn_worn_out():
    """
    More racking should be possible for cables when the upper stitch has additional misses before it. The test
    should therefore not throw an error.
    """
    input_pattern = make_knitpaint([[1, 1, 1, 1, 1,  1,  1,  1],
                                    [1, 4, 4, 4, 5,  5,  5,  1],
                                    [1, 1, 1, 1, 16, 16, 16, 1],
                                    [1, 1, 1, 1, 1,  1,  1,  1]])
    check(input_pattern)


def test_false_continuous_pickup_stitch():
    """
    Continuous pickup stitches can not only be avoided by holding loops with needles, but also by holding them with
    crossing yarn in a following course. The test should therefore not throw an error.
    """
    input_pattern = make_knitpaint([[1, 51, 52, 51, 1, 1],
                                    [1, 52, 51, 52, 1, 1],
                                    [1, 51, 52, 51, 1, 1],
                                    [1, 61, 72, 72, 1, 1]])
    check(input_pattern)


def test_different_back_knit_and_move():
    """
    Back-knit-and-move stitches work differently when front-knit-and-move stitches are in the same course:

    When there are only back-knit-and-move stitches, they work the same way as front-knit-and-move stitches would:
    - Knit is performed on the back bed
    - The loop is transferred to the front bed
    - The back bed is racked in the opposite direction of the move
    - The loop is transferred to the back bed
    - The back bed is racked to zero position

    When there are also front-knit-and-move stitches, they work differently:
    - Knit is performed on the back bed
    - The back bed is racked in the direction of the move
    - The loop is transferred to the front bed
    - The back bed is racked to zero position
    - The loop is transferred to the back bed

    This divergent behaviour changes the amount of loops transferred during the links process in this example
    """
    input_pattern_1 = make_knitpaint([[1, 1, 1, 1, 2,  1, 1],
                                      [1, 1, 1, 1, 51, 8, 1],
                                      [1, 1, 1, 1, 1,  1, 1]])
    check(input_pattern_1)

    input_pattern_2 = make_knitpaint([[1, 1, 1, 1, 2,  1, 1],
                                      [1, 7, 1, 1, 51, 8, 1],
                                      [1, 1, 1, 1, 1,  1, 1]])
    with pytest.raises(KnitPaintCheckException) as err:
        check(input_pattern_2)
    problems = err.value.problems
    assert len(problems) == 1
    assert isinstance(problems[0], TransferWithOverlappedLoopsWarning)


def test_overlapping_cables():
    """
    A cable can cross another cable. Since there are two cable pairs available, one pair can form an outer cable while
    the other pair forms an inner cable. The replacement should be correct and no error should occur
    """
    input_pattern = make_knitpaint([[1, 2,  1,  2, 1,   1],
                                    [1, 15, 10, 5, 100, 1],
                                    [1, 1,  2,  1, 2,   1]])
    check(input_pattern)
