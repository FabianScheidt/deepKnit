import math

# Define beds
BACK_BED = 0
FRONT_BED = 1
BEDS = [BACK_BED, FRONT_BED]

# Define thresholds for checking
MAX_CABLE_THRESH = 3
MAX_NUMBER_OF_LOOPS_IN_NEEDLE_WARN_THRESH = 3
MAX_NUMBER_OF_LOOPS_IN_NEEDLE_ERR_THRESH = 4
MAX_RACKING_WARN_THRESH = 5
MAX_RACKING_ERR_THRESH = 6
MAX_LOOP_HOLD_WARN_THRESH = 8
MAX_LOOP_HOLD_ERR_THRESH = 8


class KnitpaintCheckException(Exception):
    """
    Exceptions is thrown when warnings or errors occur during the check. The list of problems contains all warnings and
    errors that occurred.
    """
    def __init__(self, problems):
        self.problems = problems


class KnitpaintCheckProblem:
    """
    Superclass for problems that can occur referencing the location of the problem
    """
    def __init__(self, course, needle):
        self.course = course
        self.needle = needle


class KnitpaintCheckSyntaxError(KnitpaintCheckProblem):
    """
    Superclass for all errors that affect the syntax of the knitpaint. These problems can not be ignored. The knitpaint
    will not be processable.
    """
    pass


class KnitpaintCheckWarning(KnitpaintCheckProblem):
    """
    Superclass for all warnings that can occur during the check. The machine can process the knitpaint despite these
    warnings so they might be ignored.
    """
    pass


class KnitpaintCheckError(KnitpaintCheckProblem):
    """
    Superclass for all errors that can occur during the check. The machine can process the knitpaint despite these
    errors so they might be ignored. Errors are more serious to cause damages compared to warnings.
    """
    pass


class IncompleteCableError(KnitpaintCheckSyntaxError):
    """
    This error occurs when a cable stitch does not pair with another one
    """
    pass


class OversizedCableError(KnitpaintCheckSyntaxError):
    """
    This error occurs when a cable stitch is too long
    """
    pass


class NumberOfLoopsInNeedleWarning(KnitpaintCheckWarning):
    """
    This warning occurs when too many loops are held in a needle. It can occur by tucking to many times or transferring
    too many loops onto a needle
    """
    pass


class NumberOfLoopsInNeedleError(KnitpaintCheckWarning):
    """
    This error occurs when too many loops are held in a needle. It can occur by tucking to many times or transferring
    too many loops onto a needle
    """
    pass


class RackingWarning(KnitpaintCheckWarning):
    """
    This warning occurs for too much racking caused by big move or cable stitches
    """
    pass


class RackingError(KnitpaintCheckError):
    """
    This error occurs for too much racking caused by big move or cable stitches
    """
    pass


class LoopHoldWarning(KnitpaintCheckWarning):
    """
    """
    pass


class LoopHoldError(KnitpaintCheckError):
    """
    """
    pass


class ContinuousPickupStitchWarning(KnitpaintCheckError):
    """
    """
    pass


class Loop:
    def __init__(self, src_course, src_needle):
        self.src_course = src_course
        self.src_needle = src_needle
        self.dst_course = None
        self.dst_needle = None
        self.dst_loop = None


def check(knitpaint):
    data = knitpaint.bitmap_data[:]
    width = knitpaint.get_width()

    # Replace cable stitches with move stitches for further checking
    processed_data = resolve_cable_stitches(data, width)

    # Problems with the data will be stored here
    problems: [KnitpaintCheckProblem] = []

    # Track all loops and those that are currently on the beds
    all_loops: [Loop] = []
    bed_loops: [[[Loop]]] = [[[]] * width] * len(BEDS)

    course = 0
    needle = 0

    def get_loops(bed) -> [Loop]:
        return bed_loops[bed][needle]

    def create_loop() -> Loop:
        return Loop(course, needle)

    def knit(bed):
        # Create a new loop
        new_loop = create_loop()
        all_loops.append(new_loop)

        # Attach new loop to existing ones
        current_loops = get_loops(bed)
        for current_loop in current_loops:
            current_loop.dst_loop = new_loop
            current_loop.dst_course = course
            current_loop.dst_needle = needle

        # Todo: Check for continuous pickup stitch

        # Replace existing loops with new one
        bed_loops[bed][needle] = [new_loop]

    def tuck(bed):
        # Create a new loop
        new_loop = create_loop()
        all_loops.append(new_loop)

        # Append it
        bed_loops[bed][needle] += [new_loop]

    def transfer(src_bed, dst_bed, racking=0):
        # Get all the loops
        loops = get_loops(src_bed)

        # Clear the source bed
        bed_loops[src_bed][needle] = []

        # Add loops to destination bed
        bed_loops[dst_bed][needle + racking] += loops

    def front_knit(links_process=True):
        if links_process:
            # Todo: Links process works different: It is only performed if the previous stitch used it as well
            transfer(BACK_BED, FRONT_BED)
        knit(FRONT_BED)

    def back_knit(links_process=True):
        if links_process:
            # Todo: Links process works different: It is only performed if the previous stitch used it as well
            transfer(FRONT_BED, BACK_BED)
        knit(BACK_BED)

    def front_tuck(links_process=True):
        if links_process:
            # Todo: Links process works different: It is only performed if the previous stitch used it as well
            transfer(BACK_BED, FRONT_BED)
        tuck(FRONT_BED)

    def back_tuck(links_process=True):
        if links_process:
            # Todo: Links process works different: It is only performed if the previous stitch used it as well
            transfer(FRONT_BED, BACK_BED)
        tuck(BACK_BED)

    def front_knit_and_transfer(racking):
        front_knit()
        transfer(FRONT_BED, BACK_BED, racking)

    def back_knit_and_transfer(racking):
        back_knit()
        transfer(BACK_BED, FRONT_BED, racking)

    def front_knit_and_move(racking):
        # The links process is actually not used, but since the back bed is needed to move, this is effectively the same
        front_knit(links_process=True)
        transfer(FRONT_BED, FRONT_BED, racking)

    def back_knit_and_move(racking):
        # The links process is actually not used, but since the back bed is needed to move, this is effectively the same
        back_knit(links_process=True)
        transfer(BACK_BED, BACK_BED, racking)

    def front_split_knit_and_transfer(racking):
        # Todo...
        raise NotImplementedError

    def back_split_knit_and_transfer(racking):
        # Todo...
        raise NotImplementedError

    for i, color_number in enumerate(processed_data):
        course = i // width
        needle = i % width

        if color_number == 0 or color_number == 16:
            pass
        elif color_number == 1 or color_number == 17:
            front_knit()
        elif color_number == 2 or color_number == 18:
            back_knit()
        elif color_number == 6:
            front_knit_and_move(-1)
        elif color_number == 7:
            front_knit_and_move(1)
        elif color_number == 8:
            back_knit_and_move(-1)
        elif color_number == 9:
            back_knit_and_move(1)
        elif color_number == 11:
            front_tuck()
        elif color_number == 12:
            back_tuck()
        elif color_number == 20:
            front_knit_and_transfer(0)
        elif color_number == 21:
            front_knit_and_transfer(-1)
        elif color_number == 22:
            front_knit_and_transfer(-2)
        elif color_number == 23:
            front_knit_and_transfer(-3)
        elif color_number == 24:
            front_knit_and_transfer(1)
        elif color_number == 25:
            front_knit_and_transfer(2)
        elif color_number == 26:
            front_knit_and_transfer(3)
        elif color_number == 30:
            front_knit_and_transfer(0)
        elif color_number == 31:
            back_knit_and_transfer(-1)
        elif color_number == 32:
            back_knit_and_transfer(-2)
        elif color_number == 33:
            back_knit_and_transfer(-3)
        elif color_number == 34:
            back_knit_and_transfer(1)
        elif color_number == 35:
            back_knit_and_transfer(2)
        elif color_number == 36:
            back_knit_and_transfer(3)
        elif color_number == 40:
            front_knit_and_transfer(0)
            transfer(BACK_BED, FRONT_BED)
        elif color_number == 50:
            back_knit_and_transfer(0)
            transfer(FRONT_BED, BACK_BED)
        elif color_number == 51:
            front_knit(links_process=False)
        elif color_number == 52:
            back_knit(links_process=False)
        elif color_number == 61:
            front_knit_and_move(-1)
        elif color_number == 62:
            front_knit_and_move(-2)
        elif color_number == 63:
            front_knit_and_move(-3)
        elif color_number == 64:
            front_knit_and_move(-4)
        elif color_number == 71:
            front_knit_and_move(1)
        elif color_number == 72:
            front_knit_and_move(2)
        elif color_number == 73:
            front_knit_and_move(3)
        elif color_number == 74:
            front_knit_and_move(4)
        elif color_number == 81:
            back_knit_and_move(-1)
        elif color_number == 82:
            back_knit_and_move(-2)
        elif color_number == 83:
            back_knit_and_move(-3)
        elif color_number == 84:
            back_knit_and_move(-4)
        elif color_number == 91:
            back_knit_and_move(1)
        elif color_number == 92:
            back_knit_and_move(2)
        elif color_number == 93:
            back_knit_and_move(3)
        elif color_number == 94:
            back_knit_and_move(4)
        elif color_number == 106:
            front_split_knit_and_transfer(-1)
        elif color_number == 107:
            front_split_knit_and_transfer(1)
        elif color_number == 108:
            back_split_knit_and_transfer(-1)
        elif color_number == 109:
            back_split_knit_and_transfer(1)
        elif color_number == 116:
            transfer(FRONT_BED, BACK_BED)
            transfer(BACK_BED, FRONT_BED)
        elif color_number == 117:
            transfer(BACK_BED, FRONT_BED)
            transfer(FRONT_BED, BACK_BED)
        else:
            print(color_number)
            raise NotImplementedError

        # Check for problems
        for current_bed in BEDS:
            loops_in_needle = bed_loops[current_bed][needle]

            # Count loops in needle
            if len(loops_in_needle) >= MAX_NUMBER_OF_LOOPS_IN_NEEDLE_ERR_THRESH:
                problem = NumberOfLoopsInNeedleError(course, needle)
                problems.append(problem)
            elif len(loops_in_needle) >= MAX_NUMBER_OF_LOOPS_IN_NEEDLE_ERR_THRESH:
                problem = NumberOfLoopsInNeedleWarning(course, needle)
                problems.append(problem)

            # Get vertical distance of loops
            for loop_in_needle in loops_in_needle:
                vertical_distance = course - loop_in_needle.src_course + 1
                if vertical_distance >= MAX_LOOP_HOLD_ERR_THRESH:
                    problem = LoopHoldError(course, needle)
                    problems.append(problem)
                elif vertical_distance >= MAX_LOOP_HOLD_WARN_THRESH:
                    problem = LoopHoldWarning(course, needle)
                    problems.append(problem)

            # Todo: Check racking

    # Raise exception of problems occurred
    if len(problems) > 0:
        raise KnitpaintCheckException(problems)

    return all_loops


def resolve_cable_stitches(data, width):
    """
    Replaces cable stitches with move stitches neglecting the order of upper and lower stitch
    :return:
    """

    # Build a list of possible pairs and stitches
    cable_pairs = [
        [4, 5], [5, 4],
        [4, 10], [10, 4],
        [14, 15], [15, 14],
        [14, 100], [100, 14]
    ]
    cable_stitches = [item for sublist in cable_pairs for item in sublist]

    # Problems with the data will be stored here
    problems: [KnitpaintCheckProblem] = []

    processed_data = data.copy()
    for course in range(0, math.ceil(len(data) / width)):
        first_cable_color = None
        first_cable_start = None
        first_cable_end = None
        second_cable_color = None
        second_cable_start = None

        # Get the colors for the current course, add an extra color to make sure that the edge is handled correctly
        course_colors = data[course * width: (course + 1) * width] + [0]

        for needle, color_number in enumerate(course_colors):
            # A cable started before...
            if first_cable_start is not None and (first_cable_end is None or second_cable_start is None):
                if first_cable_end is None and color_number == first_cable_color:
                    # First half of cable just continues, no need to change anything
                    pass
                else:
                    # First half of cable ended
                    first_cable_end = needle if first_cable_end is None else first_cable_end
                    if color_number in cable_stitches:
                        # Current stitch is another cable stitch, so check if it matches a possible second half
                        matches = [p for p in cable_pairs if p[0] == first_cable_color and p[1] == color_number]
                        if len(matches) >= 1:
                            second_cable_color = color_number
                            second_cable_start = needle
                        else:
                            # Stitch does not meet expectation. Mark it as a problem but use it as the start stitch for
                            # further analysis
                            problem = IncompleteCableError(course, first_cable_start)
                            problems.append(problem)
                            first_cable_color = color_number
                            first_cable_start = needle
                            first_cable_end = None

            # Check if a cable that started before needs to end
            if second_cable_start is not None:
                if color_number != second_cable_color:
                    # The cable stitch is over, either because there is a different stitch or it is the end of the line
                    second_cable_end = needle
                    cable_width = second_cable_end - first_cable_start
                    first_cable_width = first_cable_end - first_cable_start
                    second_cable_width = second_cable_end - second_cable_start

                    if first_cable_width > MAX_CABLE_THRESH or second_cable_width > MAX_CABLE_THRESH:
                        # The cable exceeds the maximum size. Create a syntax error
                        problem = OversizedCableError(course, first_cable_start)
                        problems.append(problem)
                    else:
                        # Do the replacement
                        first_move = cable_width - first_cable_width
                        second_move = cable_width - second_cable_width
                        first_replacement = 70 + first_move
                        second_replacement = 60 + second_move
                        for index in range(course * width + first_cable_start, course * width + first_cable_end):
                            processed_data[index] = first_replacement
                        for index in range(course * width + second_cable_start, course * width + second_cable_end):
                            processed_data[index] = second_replacement

                    # Clean up
                    first_cable_color = None
                    first_cable_start = None
                    first_cable_end = None
                    second_cable_color = None
                    second_cable_start = None

            # Check if a new cable should start
            if first_cable_start is None:
                if color_number in cable_stitches:
                    # First half of cable just started so store color and position
                    first_cable_color = color_number
                    first_cable_start = needle
                else:
                    # The stitch is not a cable stitch so there is no need to do anything
                    pass

            if needle == width and first_cable_start is not None and second_cable_start is None:
                # Cables are not completed on the edge so add a problem
                problem = IncompleteCableError(course, first_cable_start)
                problems.append(problem)

    # Code with syntax problems can not be processed further
    if len(problems) > 0:
        raise KnitpaintCheckException(problems)

    return processed_data
