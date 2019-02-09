from typing import Generator, List
from functools import reduce
from .check_color_numbers import *
from .check_problems import *
from .check_cable_resolution import resolve_cable_stitches


# Create a class as a structure for processed loops
class Loop:
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
    virtual_knitting_machine = VirtualKnittingMachine(num_wales)
    return virtual_knitting_machine.run(processed_data, num_wales)


class VirtualKnittingMachine:
    """
    This class processes knitpaint data and tracks where loops come from and where they go by virtually performing
    the knitting of a machine. It allows to find problems during the knit.
    """

    def __init__(self, needle_count):
        """
        Initializes the virtual knitting machine with a number of virtual needles. Processed patterns can not be wider
        than this number
        :param needle_count:
        """
        # Initialize an empty list for all loops
        self.all_loops: List[Loop] = []

        # Initialize an empty list that tracks the loops on each needle on the front and back bed
        self.bed_loops: List[List[List[Loop]]] = [[], []]
        for _ in range(needle_count):
            self.bed_loops[FRONT].append([])
            self.bed_loops[BACK].append([])

        # Keep track of the last knitted loop
        self.last_loop: Loop = None

        # Set current course, wale and racking to default
        self.course = 0
        self.wale = 0
        self.racking = 0

        # Initialize empty list of problems
        self.problems: List[KnitpaintCheckProblem] = []

    def run(self, data, num_wales) -> List[Loop]:
        """
        Runs the provided knitting data, creates loops and tracks where they start and where they go. If no problems
        occur, a list of loops is returned, otherwise a KnitpaintCheckException is raised, containing a list of problems
        :param data:
        :param num_wales:
        :return:
        """
        # Split the data into courses
        courses_data = [data[i: i + num_wales] for i in range(0, len(data), num_wales)]

        # Iterate over all courses
        for data_course, data_course_color_numbers in enumerate(courses_data):

            # Check if the increase of the course causes distance problems
            self.check_distance_of_loops()

            # Perform transfer before
            for color_number in self.iterate_course(data_course_color_numbers):
                transfer_before = color_number.transfer_before_operation

                # Links process will only be performed if the current color number specifies it and there is at least
                # one loop on the opposite bed that was knitted by a stitch that also specified it
                if transfer_before is LINKS:
                    transfer_before = NO_TRANSFER
                    opposite_bed = FRONT if color_number.bed == BACK else BACK
                    opposite_loops = self.bed_loops[opposite_bed][self.wale]
                    opposite_needs_links_process = [loop.needs_links_process for loop in opposite_loops]
                    opposite_needs_links_process = reduce(lambda x, y: x or y, opposite_needs_links_process, False)
                    if opposite_needs_links_process:
                        if color_number.bed == FRONT:
                            transfer_before = BACK_TO_FRONT
                        elif color_number.bed == BACK:
                            transfer_before = FRONT_TO_BACK
                self.transfer(transfer_before)

            # Check if the transfer caused problems
            self.check_number_of_loops_in_needles()

            # Perform operations
            for color_number in self.iterate_course(data_course_color_numbers):
                if color_number.operation is KNIT:
                    self.knit(color_number.bed, color_number.transfer_before_operation == LINKS)
                elif color_number.operation is TUCK:
                    self.tuck(color_number.bed, color_number.transfer_before_operation == LINKS)
                elif color_number.operation is SPLIT:
                    self.split(color_number.bed, color_number.transfer_before_operation == LINKS)

            # Check if the operations caused problems
            self.check_number_of_loops_in_needles()

            # Perform transfer before racking operations
            for color_number in self.iterate_course(data_course_color_numbers):
                self.transfer(color_number.transfer_before_racking)

            # Check if the transfer caused problems
            self.check_number_of_loops_in_needles()

            # Perform racking operations in the same order as the machine
            min_racking = 0
            max_racking = 0
            for self.racking in [-1, 1, -2, 2, -3, 3, -4, 4, -5, 5, -6, 6, -7, 7]:
                for color_number in self.iterate_course(data_course_color_numbers):
                    if color_number.racking == self.racking:
                        self.transfer(color_number.transfer_while_racking)

                        min_racking = self.racking if self.racking < min_racking else min_racking
                        max_racking = self.racking if self.racking > max_racking else max_racking

                        if max_racking - min_racking >= MAX_RACKING_WARN_THRESH:
                            self.create_problem(RackingWarning(self.course, self.wale))

                        if max_racking - min_racking >= MAX_RACKING_ERR_THRESH:
                            self.create_problem(RackingError(self.course, self.wale))
                # Check if the transfer caused problems
                self.check_number_of_loops_in_needles()

            # Reset racking
            self.racking = 0

            # Perform transfer after racking operations. If the loop was racked before it needs to be offset.
            for color_number in self.iterate_course(data_course_color_numbers):
                self.transfer(color_number.transfer_after_racking, color_number.racking)

            # Check if the transfer caused problems
            self.check_number_of_loops_in_needles()

            # Increase the course
            self.course += 1

        # Check for continuous pickup stitches
        self.check_for_continuous_pickup_stitches()

        # Raise exception of problems occurred
        if len(self.problems) > 0:
            raise KnitpaintCheckException(self.problems, self.all_loops)

        return self.all_loops

    def iterate_course(self, color_numbers) -> Generator[ColorNumber, None, None]:
        """
        Iterates over the provided color numbers and sets the current wale accordingly. Throws an error if a color
        number occurs that is not implemented. Even courses will go left to right, uneven courses go right to left.
        :param color_numbers:
        :return:
        """
        carriage_going_right = self.course % 2 == 0
        wales = range(len(color_numbers))
        wales = wales if carriage_going_right else reversed(wales)
        for self.wale in wales:
            color_index = color_numbers[self.wale]
            color_number = COLOR_NUMBERS[color_index]
            if color_number is None:
                raise NotImplementedError("Color number " + str(color_index) + " is not implemented.")
            yield color_number

    def create_loop(self, needs_links_process) -> Loop:
        """
        Creates a loop at the current course and wale, adds it to the list of all loops and returns it
        :return:
        """
        loop = Loop(self.course, self.wale, needs_links_process)
        if self.last_loop is not None:
            loop.prev_loop = self.last_loop
            self.last_loop.next_loop = loop
        self.last_loop = loop
        self.all_loops.append(loop)
        return loop

    def knit(self, bed, needs_links_process) -> None:
        """
        Performs a knit operation at the current course and wale
        :param bed:
        :param needs_links_process:
        :return:
        """
        new_loop = self.create_loop(needs_links_process)
        existing_loops = self.bed_loops[bed][self.wale]
        new_loop.src_loops = existing_loops

        for l in existing_loops:
            l.dst_course = self.course
            l.dst_wale = self.wale
            l.dst_loop = new_loop
        self.bed_loops[bed][self.wale] = [new_loop]

    def tuck(self, bed, needs_links_process) -> None:
        """
        Performs a tuck operation at thr current course and wale
        :param bed:
        :param needs_links_process:
        :return:
        """
        new_loop = self.create_loop(needs_links_process)
        self.bed_loops[bed][self.wale].append(new_loop)

    def split(self, bed, needs_links_process) -> None:
        """
        Performs a split operation at the current course and wale
        :param bed:
        :param needs_links_process:
        :return:
        """
        if bed is FRONT:
            self.transfer(FRONT_TO_BACK)
        if bed is BACK:
            self.transfer(BACK_TO_FRONT)
        self.knit(bed, needs_links_process)

    def transfer(self, from_to, offset=0) -> None:
        """
        Performs a transfer from one bed to another at the current course and wale. The wale can optionally be offset
        :param from_to:
        :param offset:
        :return:
        """
        if from_to is FRONT_TO_BACK or from_to is BACK_TO_FRONT:
            front = self.bed_loops[FRONT]
            back = self.bed_loops[BACK]
            from_bed = front if from_to is FRONT_TO_BACK else back
            to_bed = back if from_to is FRONT_TO_BACK else front
            wale = self.wale + offset
            transferred_loops = from_bed[wale]
            if 0 <= wale < len(from_bed) and 0 <= wale + self.racking < len(to_bed):
                from_bed[wale] = []
                to_bed[wale + self.racking] += transferred_loops
            else:
                self.create_problem(TransferOutOfBedError(self.course, self.wale))
        elif from_to is LINKS:
            raise ValueError("Links process is only available before operations and should be processed manually")

    def create_problem(self, problem) -> None:
        """
        Creates a new problem and adds it to the list of problems
        :param problem:
        :return:
        """
        for index, p in enumerate(self.problems):
            if p.course == problem.course and p.wale == problem.wale:
                # Same problems will only be added once
                if isinstance(problem, p.__class__):
                    return

                # Errors should override warnings
                if (isinstance(p, NumberOfLoopsInNeedleWarning) and isinstance(problem, NumberOfLoopsInNeedleError)) or\
                   (isinstance(p, LoopHoldWarning) and isinstance(problem, LoopHoldError)) or\
                   (isinstance(p, RackingWarning) and isinstance(problem, RackingError)):
                    self.problems[index] = problem
                    return

                # Warnings should not be added if an error exists
                if (isinstance(problem, NumberOfLoopsInNeedleWarning) and isinstance(p, NumberOfLoopsInNeedleError)) or\
                   (isinstance(problem, LoopHoldWarning) and isinstance(p, LoopHoldError)) or\
                   (isinstance(problem, RackingWarning) and isinstance(p, RackingError)):
                    return
        self.problems.append(problem)

    def check_number_of_loops_in_needles(self) -> None:
        """
        Iterates over all needles to check how many loops are held by them. Adds problems if needles exceed a threshold
        :return:
        """
        for bed in self.bed_loops:
            for needle, needle_loops in enumerate(bed):
                if len(needle_loops) >= MAX_NUMBER_OF_LOOPS_IN_NEEDLE_ERR_THRESH:
                    self.create_problem(NumberOfLoopsInNeedleError(self.course, needle))
                if len(needle_loops) >= MAX_NUMBER_OF_LOOPS_IN_NEEDLE_WARN_THRESH:
                    self.create_problem(NumberOfLoopsInNeedleWarning(self.course, needle))

    def check_distance_of_loops(self) -> None:
        """
        Iterates overe all currently held loops to check the vertical distance to their origin. Adds problems if a
        distance exceeds a threshold
        :return:
        """
        for bed in self.bed_loops:
            for needle, needle_loops in enumerate(bed):
                for loop in needle_loops:
                    if self.course - loop.src_course >= MAX_LOOP_HOLD_WARN_THRESH:
                        self.create_problem(LoopHoldWarning(self.course, needle))
                    if self.course - loop.src_course >= MAX_LOOP_HOLD_ERR_THRESH:
                        self.create_problem(LoopHoldError(self.course, needle))

    def check_for_continuous_pickup_stitches(self):
        """
        Checks if any loop is a continuous pickup stitch
        :return:
        """
        for loop in self.all_loops:
            if loop.is_continuous_pickup_stitch():
                problem = ContinuousPickupStitchWarning(loop.src_course, loop.src_wale)
                self.create_problem(problem)
