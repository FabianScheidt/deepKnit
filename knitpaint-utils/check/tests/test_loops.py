from .make_knitpaint import make_knitpaint
from .. import check


def assert_from_to(loops, src_course, src_wale, dst_course, dst_wale):
    """
    Helper method to assert if a loop goes from one position to another
    :param loops:
    :param src_course:
    :param src_wale:
    :param dst_course:
    :param dst_wale:
    :return:
    """
    matches = [l for l in loops if l.src_course == src_course and l.src_wale == src_wale
               and l.dst_course == dst_course and l.dst_wale == dst_wale]
    assert len(matches) == 1, "Expected loop was not found"


def test_single_jersey():
    input_pattern = make_knitpaint([[1, 1, 1],
                                    [1, 1, 1]])
    loops = check(input_pattern)
    assert len(loops) == len(input_pattern.bitmap_data)
    assert_from_to(loops, 0, 0, 1, 0)
    assert_from_to(loops, 0, 1, 1, 1)
    assert_from_to(loops, 0, 2, 1, 2)
    assert_from_to(loops, 1, 0, None, None)
    assert_from_to(loops, 1, 1, None, None)
    assert_from_to(loops, 1, 2, None, None)
    assert loops[0].prev_loop is None
    assert loops[0].next_loop is loops[1]
    assert loops[0].dst_loop is loops[5]
    assert loops[1].prev_loop is loops[0]
    assert loops[1].next_loop is loops[2]
    assert loops[1].dst_loop is loops[4]
    assert loops[2].prev_loop is loops[1]
    assert loops[2].next_loop is loops[3]
    assert loops[2].dst_loop is loops[3]
    assert len(loops[4].src_loops) == 1
    assert loops[4].src_loops[0] is loops[1]


def test_links_process_1():
    input_pattern = make_knitpaint([[2, 1, 2],
                                    [1, 2, 1]])
    loops = check(input_pattern)
    assert len(loops) == len(input_pattern.bitmap_data)
    assert_from_to(loops, 0, 0, 1, 0)
    assert_from_to(loops, 0, 1, 1, 1)
    assert_from_to(loops, 0, 2, 1, 2)
    assert_from_to(loops, 1, 0, None, None)
    assert_from_to(loops, 1, 1, None, None)
    assert_from_to(loops, 1, 2, None, None)


def test_links_process_2():
    input_pattern = make_knitpaint([[1, 1,  1],
                                    [1, 16, 1],
                                    [1, 2,  1]])
    loops = check(input_pattern)
    assert len(loops) == len(input_pattern.bitmap_data) - 1
    assert_from_to(loops, 0, 1, None, None)
    assert_from_to(loops, 2, 1, None, None)


def test_links_process_3():
    input_pattern = make_knitpaint([[1, 1, 1, 1, 1],
                                    [1, 8, 1, 9, 1]])
    # No error should occur since links process suppresses transfer at the end of move
    loops = check(input_pattern)
    assert len(loops) > 0


def test_links_process_4():
    input_pattern = make_knitpaint([*[[1, 1, 2, 1]] * 8,
                                      [1, 4, 5, 1],
                                      [1, 1, 1, 1]])
    # No error should occur since links process suppresses transfer at the end of move
    loops = check(input_pattern)
    assert len(loops) > 0


def test_miss():
    input_pattern = make_knitpaint([[1, 1,  1, 1,   1, 1,   1],
                                    [1, 16, 1, 116, 1, 117, 1],
                                    [1, 1,  1, 1,   1, 1,   1]])
    loops = check(input_pattern)
    assert len(loops) == len(input_pattern.bitmap_data) - 3
    assert_from_to(loops, 0, 0, 1, 0)
    assert_from_to(loops, 0, 1, 2, 1)
    assert_from_to(loops, 0, 2, 1, 2)
    assert_from_to(loops, 0, 3, 2, 3)
    assert_from_to(loops, 0, 4, 1, 4)
    assert_from_to(loops, 0, 5, 2, 5)
    assert_from_to(loops, 0, 6, 1, 6)
    assert_from_to(loops, 1, 0, 2, 0)
    assert_from_to(loops, 1, 2, 2, 2)
    assert_from_to(loops, 1, 4, 2, 4)
    assert_from_to(loops, 1, 6, 2, 6)
    assert_from_to(loops, 2, 1, None, None)
    assert_from_to(loops, 2, 2, None, None)
    assert_from_to(loops, 2, 3, None, None)
    assert_from_to(loops, 2, 4, None, None)
    assert_from_to(loops, 2, 5, None, None)
    assert_from_to(loops, 2, 6, None, None)
    assert loops[3].dst_loop is loops[14]
    assert len(loops[14].src_loops) == 1
    assert loops[14].src_loops[0] is loops[3]


def test_tuck():
    input_pattern = make_knitpaint([[1, 1,  1, 2, 2,  2],
                                    [1, 11, 1, 2, 12, 2],
                                    [1, 1,  1, 2, 2,  2]])
    loops = check(input_pattern)
    assert len(loops) == len(input_pattern.bitmap_data)
    assert_from_to(loops, 0, 0, 1, 0)
    assert_from_to(loops, 0, 1, 2, 1)
    assert_from_to(loops, 0, 2, 1, 2)
    assert_from_to(loops, 0, 3, 1, 3)
    assert_from_to(loops, 0, 4, 2, 4)
    assert_from_to(loops, 0, 5, 1, 5)
    assert_from_to(loops, 1, 0, 2, 0)
    assert_from_to(loops, 1, 1, 2, 1)
    assert_from_to(loops, 1, 2, 2, 2)
    assert_from_to(loops, 1, 3, 2, 3)
    assert_from_to(loops, 1, 4, 2, 4)
    assert_from_to(loops, 1, 5, 2, 5)
    assert_from_to(loops, 2, 0, None, None)
    assert_from_to(loops, 2, 1, None, None)
    assert_from_to(loops, 2, 2, None, None)
    assert_from_to(loops, 2, 3, None, None)
    assert_from_to(loops, 2, 4, None, None)
    assert_from_to(loops, 2, 5, None, None)
    assert len(loops[7].src_loops) == 0
    assert len(loops[10].src_loops) == 0
    assert len(loops[13].src_loops) == 2
    assert len(loops[16].src_loops) == 2


def test_single_move():
    input_pattern = make_knitpaint([[1, 1, 1, 1, 1, 1, 1, 1, 1],
                                    [1, 6, 1, 8, 1, 7, 1, 9, 1]])
    loops = check(input_pattern)
    assert len(loops) == len(input_pattern.bitmap_data)
    assert_from_to(loops, 0, 0, 1, 0)
    assert_from_to(loops, 0, 1, 1, 0)
    assert_from_to(loops, 0, 2, 1, 2)
    assert_from_to(loops, 0, 3, 1, 2)
    assert_from_to(loops, 0, 4, 1, 4)
    assert_from_to(loops, 0, 5, 1, 6)
    assert_from_to(loops, 0, 6, 1, 6)
    assert_from_to(loops, 0, 7, 1, 8)
    assert_from_to(loops, 0, 8, 1, 8)


def test_multi_move_left():
    input_pattern = make_knitpaint([[1, 1, 1, 1,  1,  1],
                                    [1, 6, 6, 61, 62, 1]])
    loops = check(input_pattern)
    assert len(loops) == len(input_pattern.bitmap_data)
    assert_from_to(loops, 0, 0, 1, 0)
    assert_from_to(loops, 0, 1, 1, 0)
    assert_from_to(loops, 0, 2, 1, 1)
    assert_from_to(loops, 0, 3, 1, 2)
    assert_from_to(loops, 0, 4, 1, 2)
    assert_from_to(loops, 0, 5, 1, 5)


def test_multi_move_right():
    input_pattern = make_knitpaint([[1, 1,  1,  1, 1, 1],
                                    [1, 72, 71, 7, 7, 1]])
    loops = check(input_pattern)
    assert len(loops) == len(input_pattern.bitmap_data)
    assert_from_to(loops, 0, 0, 1, 0)
    assert_from_to(loops, 0, 1, 1, 3)
    assert_from_to(loops, 0, 2, 1, 3)
    assert_from_to(loops, 0, 3, 1, 4)
    assert_from_to(loops, 0, 4, 1, 5)
    assert_from_to(loops, 0, 5, 1, 5)


def test_back_move_with_miss():
    input_pattern = make_knitpaint([[2, 2, 2,  2, 2,  2, 2],
                                    [2, 2, 16, 2, 16, 2, 2],
                                    [2, 2, 8,  1, 9,  2, 2],
                                    [2, 2, 2,  1, 2,  2, 2]])
    loops = check(input_pattern)
    assert_from_to(loops, 0, 1, 1, 1)
    assert_from_to(loops, 0, 2, 1, 2)
    assert_from_to(loops, 0, 3, 1, 3)
    assert_from_to(loops, 0, 4, 1, 4)
    assert_from_to(loops, 0, 5, 1, 5)
    assert_from_to(loops, 1, 1, 2, 1)
    assert_from_to(loops, 1, 2, 2, 1)
    assert_from_to(loops, 1, 3, 2, 3)
    assert_from_to(loops, 1, 4, 2, 5)
    assert_from_to(loops, 1, 5, 2, 5)


def test_cables():
    input_pattern = make_knitpaint([[1, 1, 1, 1, 1, 1],
                                    [1, 4, 4, 5, 5, 1]])
    loops = check(input_pattern)
    assert len(loops) == len(input_pattern.bitmap_data)
    assert_from_to(loops, 0, 0, 1, 0)
    assert_from_to(loops, 0, 1, 1, 3)
    assert_from_to(loops, 0, 2, 1, 4)
    assert_from_to(loops, 0, 3, 1, 1)
    assert_from_to(loops, 0, 4, 1, 2)
    assert_from_to(loops, 0, 5, 1, 5)
