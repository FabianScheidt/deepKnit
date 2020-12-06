from typing import List, Generator
from .loop import Loop
from .color_numbers import *
from .problems import *


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
        self.problems: List[KnitPaintCheckProblem] = []

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

            # Perform operations
            for color_number in self.iterate_course(data_course_color_numbers):
                if color_number.operation is KNIT:
                    self.knit(color_number.bed)
                elif color_number.operation is TUCK:
                    self.tuck(color_number.bed)
                elif color_number.operation is SPLIT:
                    self.split(color_number.bed)

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
                offset = color_number.racking
                offset_wale = self.wale + offset

                # If the current color number and the color number in the next course both use links process and both
                # operate on different beds, a links transfer should be performed instead of a regular transfer
                perform_links = False
                if len(courses_data) > self.course + 1:
                    next_course_data = courses_data[self.course + 1]
                    next_color_number = COLOR_NUMBERS[next_course_data[offset_wale]]
                    both_links = color_number.links_process and next_color_number.links_process
                    both_opposite = (color_number.bed == FRONT and next_color_number.bed == BACK) or \
                                    (color_number.bed == BACK and next_color_number.bed == FRONT)
                    if both_links and both_opposite:
                        perform_links = True

                if perform_links:
                    self.transfer(BACK_TO_FRONT if color_number.bed is BACK else FRONT_TO_BACK, offset)
                else:
                    self.transfer(color_number.transfer_after_racking, offset)

            # Check if the transfer caused problems
            self.check_number_of_loops_in_needles()

            # Increase the course
            self.course += 1

        # Check for continuous pickup stitches
        self.check_for_continuous_pickup_stitches()

        # Raise exception of problems occurred
        if len(self.problems) > 0:
            raise KnitPaintCheckException(self.problems, self.all_loops)

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

    def create_loop(self) -> Loop:
        """
        Creates a loop at the current course and wale, adds it to the list of all loops and returns it
        :return:
        """
        loop = Loop(self.course, self.wale)
        if self.last_loop is not None:
            loop.prev_loop = self.last_loop
            self.last_loop.next_loop = loop
        self.last_loop = loop
        self.all_loops.append(loop)
        return loop

    def knit(self, bed) -> None:
        """
        Performs a knit operation at the current course and wale
        :param bed:
        :return:
        """
        new_loop = self.create_loop()
        existing_loops = self.bed_loops[bed][self.wale]
        new_loop.src_loops = existing_loops

        for l in existing_loops:
            l.dst_course = self.course
            l.dst_wale = self.wale
            l.dst_loop = new_loop
        self.bed_loops[bed][self.wale] = [new_loop]

    def tuck(self, bed) -> None:
        """
        Performs a tuck operation at thr current course and wale
        :param bed:
        :return:
        """
        new_loop = self.create_loop()
        self.bed_loops[bed][self.wale].append(new_loop)

    def split(self, bed) -> None:
        """
        Performs a split operation at the current course and wale
        :param bed:
        :return:
        """
        if bed is FRONT:
            self.transfer(FRONT_TO_BACK)
        if bed is BACK:
            self.transfer(BACK_TO_FRONT)
        self.knit(bed)

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

            # Check how many loops are transferred
            if len(transferred_loops) >= MAX_OVERLAPPED_LOOP_TRANSFER_WARN_THRESH:
                self.create_problem(TransferWithOverlappedLoopsWarning(self.course, self.wale))
            if len(transferred_loops) >= MAX_OVERLAPPED_LOOP_TRANSFER_ERR_THRESH:
                self.create_problem(TransferWithOverlappedLoopsError(self.course, self.wale))

            # Check if all of the transferred loops are pickup stitches
            transferred_pickup_loops = [loop for loop in transferred_loops if loop.is_pickup_stitch()]
            if len(transferred_pickup_loops) > 0 and len(transferred_pickup_loops) == len(transferred_loops):
                self.create_problem(TransferOfPickupStitchWarning(self.course, self.wale))

            # Check if the transfer goes out of the configured bed
            if 0 <= wale < len(from_bed) and 0 <= wale + self.racking < len(to_bed):
                from_bed[wale] = []
                to_bed[wale + self.racking] += transferred_loops
            else:
                self.create_problem(TransferOutOfBedError(self.course, self.wale))

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
