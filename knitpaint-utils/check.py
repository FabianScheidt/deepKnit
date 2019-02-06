from .check_color_numbers import *
from .check_problems import *
from .check_cable_resolution import resolve_cable_stitches


# Create a class as a structure for processed loops
class Loop:
    def __init__(self, src_course, src_wale):
        self.src_course = src_course
        self.src_wale = src_wale
        self.dst_course = None
        self.dst_wale = None
        self.dst_loop = None


def check(knitpaint):
    """
    Checks the provided knitpaint by virtually performing the actual knitting. Raises a KnitpaintCheckException
    containing a list of problems that occurred. Returns a list of loop if no problems occurred
    :param knitpaint:
    :return:
    """
    data = knitpaint.bitmap_data[:]
    width = knitpaint.get_width()
    height = knitpaint.get_height()

    # Replace cable stitches with move stitches for further checking
    processed_data = resolve_cable_stitches(data, width)

    # Problems with the data will be stored here
    problems: [KnitpaintCheckProblem] = []

    # Track all loops and those that are currently on the beds
    all_loops: [Loop] = []
    bed_loops: [[[Loop]]] = [[], []]
    for _ in range(width):
        bed_loops[0].append([])
        bed_loops[1].append([])

    # Always keep track of the current course, wale and racking
    course = None
    wale = None
    racking = 0

    # Define a helper method to iterate over the wales of the current course and get the color number
    def iterate_course():
        for wale_ in range(width):
            color_index = processed_data[course * width + wale_]
            color_number = COLOR_NUMBERS[color_index]
            if color_number is None:
                raise NotImplementedError("Color number " + str(color_index) + " is not implemented.")
            yield wale_, color_number

    # Define a helper method to create loops and store them in the list of all loops
    def create_loop():
        loop = Loop(course, wale)
        all_loops.append(loop)
        return loop

    # Define a helper method to transfer loops from one bed to another
    def transfer(from_to):
        if from_to is FRONT_TO_BACK:
            transferred_loops = bed_loops[FRONT][wale]
            bed_loops[FRONT][wale] = []
            bed_loops[BACK][wale + racking] += transferred_loops
        elif from_to is BACK_TO_FRONT:
            transferred_loops = bed_loops[BACK][wale]
            bed_loops[BACK][wale] = []
            bed_loops[FRONT][wale + racking] += transferred_loops
        elif from_to is LINKS:
            raise ValueError("Links process is only available before operations and should be processed manually")

    # Iterate over all courses
    for course in range(height):

        # Perform transfer before
        for wale, color_number in iterate_course():
            transfer_before = color_number.transfer_before_operation

            # Links process will only be performed if the current and the previous
            # color number specify it and they are on different beds
            if transfer_before is LINKS:
                transfer_before = NO_TRANSFER
                previous_color_number = COLOR_NUMBERS[processed_data[(course - 1) * width + wale]]
                both_links = previous_color_number.transfer_before_operation is LINKS
                both_different_bed = previous_color_number.bed != color_number.bed
                if both_links and both_different_bed:
                    if color_number.bed == FRONT:
                        transfer_before = BACK_TO_FRONT
                    elif color_number.bed == BACK:
                        transfer_before = FRONT_TO_BACK
            transfer(transfer_before)

        # Perform operations
        for wale, color_number in iterate_course():

            # Knit
            if color_number.operation is KNIT:
                new_loop = create_loop()
                existing_loops = bed_loops[color_number.bed][wale]

                for l in existing_loops:
                    l.dst_course = course
                    l.dst_wale = wale
                    l.dst_loop = new_loop
                bed_loops[color_number.bed][wale] = [new_loop]

            # Tuck
            if color_number.operation is TUCK:
                new_loop = create_loop()
                bed_loops[color_number.bed][wale].append(new_loop)
                pass

            # Split
            if color_number.operation is SPLIT:
                if color_number.bed is FRONT:
                    transfer(FRONT_TO_BACK)
                if color_number.bed is BACK:
                    transfer(BACK_TO_FRONT)
                new_loop = create_loop()
                bed_loops[color_number.bed][wale] = [new_loop]

        # Perform transfer before racking operations
        for wale, color_number in iterate_course():
            transfer(color_number.transfer_before_racking)

        # Perform racking operations in the same order as the machine
        for racking in [-1, 1, -2, 2, -3, 3, -4, 4, -5, 5, -6, 6, -7, 7]:
            for wale, color_number in iterate_course():
                if color_number.racking == racking:
                    transfer(color_number.transfer_while_racking)
        racking = 0

        # Perform transfer after racking operations
        for wale, color_number in iterate_course():
            transfer(color_number.transfer_after_racking)

    # Raise exception of problems occurred
    if len(problems) > 0:
        raise KnitpaintCheckException(problems)

    return all_loops
