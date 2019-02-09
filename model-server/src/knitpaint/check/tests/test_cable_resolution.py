import pytest
from ..cable_resolution import resolve_cable_stitches
from ..problems import KnitpaintCheckException


def test_resolve_no_cable_stitches():
    """
    Input without cable stitches should be unchanged
    """
    in_data = [1, 2, 1, 2, 1, 2, 1, 2]
    ex_data = [1, 2, 1, 2, 1, 2, 1, 2]
    res = resolve_cable_stitches(in_data, len(in_data))
    assert res == ex_data


def test_resolve_single_cable_stitches():
    """
    Single cables should be replaced properly
    """
    in_data = [1, 1, 1, 4,  5,  1, 1, 1]
    ex_data = [1, 1, 1, 71, 61, 1, 1, 1]
    res = resolve_cable_stitches(in_data, len(in_data))
    assert res == ex_data


def test_resolve_edge_cable_stitches():
    """
    Cables at the edge replaced properly
    """
    in_data = [1, 1, 1, 1, 1, 1, 4,  5]
    ex_data = [1, 1, 1, 1, 1, 1, 71, 61]
    res = resolve_cable_stitches(in_data, len(in_data))
    assert res == ex_data


def test_resolve_multiple_cable_stitches():
    """
    Single cables should be replaced properly
    """
    in_data = [1, 1, 4,  5,  15, 14, 1, 1]
    ex_data = [1, 1, 71, 61, 71, 61, 1, 1]
    res = resolve_cable_stitches(in_data, len(in_data))
    assert res == ex_data


def test_resolve_double_cable_stitches():
    """
    Double cables should be replaced properly
    """
    in_data = [1, 1, 14, 14, 15, 15, 1, 1]
    ex_data = [1, 1, 72, 72, 62, 62, 1, 1]
    res = resolve_cable_stitches(in_data, len(in_data))
    assert res == ex_data


def test_resolve_imbalanced_cable_stitches():
    """
    Imbalanced cables should be replaced properly
    """
    in_data = [1, 1, 1, 14, 100, 100, 1, 1]
    ex_data = [1, 1, 1, 72, 61,  61,  1, 1]
    res = resolve_cable_stitches(in_data, len(in_data))
    assert res == ex_data


def test_resolve_disconnected_cable_stitches():
    """
    Cables with other stitches in between should be replaced properly
    """
    in_data = [1, 1, 1, 4,  1, 5,  1, 1]
    ex_data = [1, 1, 1, 72, 1, 62, 1, 1]
    res = resolve_cable_stitches(in_data, len(in_data))
    assert res == ex_data


def test_multi_line_cable_stitches():
    """
    Cables should be found in multiple lines, not across lines
    """
    in_data = [1, 5,  4,  1, 1, 14, 100, 1]
    ex_data = [1, 71, 61, 1, 1, 71, 61,  1]
    res = resolve_cable_stitches(in_data, 4)
    assert res == ex_data

    in_data = [1, 1, 1, 4, 5, 1, 1, 1]
    with pytest.raises(KnitpaintCheckException) as err:
        resolve_cable_stitches(in_data, 4)
    problems = err.value.problems
    assert len(problems) == 2
    assert problems[0].course == 0
    assert problems[0].wale == 3
    assert problems[1].course == 1
    assert problems[1].wale == 0


def test_single_cable_stitches():
    """
    Single cable stitches should throw an error
    """
    in_data = [1, 1, 1, 4, 1, 1, 1, 1]
    with pytest.raises(KnitpaintCheckException) as err:
        resolve_cable_stitches(in_data, len(in_data))
    problems = err.value.problems
    assert len(problems) == 1
    assert problems[0].course == 0
    assert problems[0].wale == 3

    in_data = [1, 1, 1, 1, 1, 1, 1, 4]
    with pytest.raises(KnitpaintCheckException) as err:
        resolve_cable_stitches(in_data, len(in_data))
    problems = err.value.problems
    assert len(problems) == 1
    assert problems[0].course == 0
    assert problems[0].wale == 7


def test_incompatible_cable_stitches():
    """
    Cable stitches that do not pair should throw an error
    """
    in_data = [1, 1, 1, 4, 15, 1, 1, 1]
    with pytest.raises(KnitpaintCheckException) as err:
        resolve_cable_stitches(in_data, len(in_data))
    problems = err.value.problems
    assert len(problems) == 2
    assert problems[0].course == 0
    assert problems[0].wale == 3
    assert problems[1].course == 0
    assert problems[1].wale == 4


def test_long_cable_stitches():
    """
    Cable stitches that are too big should throw an error
    """
    in_data = [1, 4, 4, 4, 4, 5, 1, 1]
    with pytest.raises(KnitpaintCheckException) as err:
        resolve_cable_stitches(in_data, len(in_data))
    problems = err.value.problems
    assert len(problems) == 1
    assert problems[0].course == 0
    assert problems[0].wale == 1
