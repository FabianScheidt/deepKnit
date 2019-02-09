from typing import List


class Loop:
    """
    a structure for processed loops
    """
    def __init__(self, src_course, src_wale, needs_links_process):
        self.src_course = src_course
        self.src_wale = src_wale
        self.src_loops: List[Loop] = []
        self.prev_loop: Loop = None
        self.next_loop: Loop = None
        self.dst_course = None
        self.dst_wale = None
        self.dst_loop: Loop = None
        self.needs_links_process: bool = needs_links_process

    def is_pickup_stitch(self) -> bool:
        """
        Returns true if the loop has no source loops. oops in the first course should not be considered a pickup stitch
        :return:
        """
        return self.src_course != 0 and len(self.src_loops) == 0

    def is_continuous_pickup_stitch(self):
        """
        A pickup stitch becomes a continuous pickup stitch if adjacent pickup stitches are released adjacent
        :return:
        """
        # The course can only be a continuous pickup stitch if it is a pickup stitch
        if not self.is_pickup_stitch():
            return False

        # As long as the loop is still attached to a needle, it can not be a continuous pickup stitch
        if self.dst_loop is None:
            return False

        # If the destination loop is attached to another loop (e. g. caused by a tuck), this loop is
        # not a continuous pickup stitch
        if len(self.dst_loop.src_loops) > 1:
            return False

        # Check previous loop
        if self.prev_loop is not None and \
                self.prev_loop.src_course == self.src_course and \
                self.prev_loop.is_pickup_stitch() and \
                self.prev_loop.dst_loop is not None and \
                (self.prev_loop.dst_loop.next_loop is self.dst_loop or
                 self.prev_loop.dst_loop.prev_loop is self.dst_loop):
            return True

        # Check next loop
        if self.next_loop is not None and \
                self.next_loop.src_course == self.src_course and \
                self.next_loop.is_pickup_stitch() and \
                self.next_loop.dst_loop is not None and \
                (self.next_loop.dst_loop.next_loop is self.dst_loop or
                 self.next_loop.dst_loop.prev_loop is self.dst_loop):
            return True

        return False
