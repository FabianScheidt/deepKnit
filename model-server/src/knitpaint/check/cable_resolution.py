import math
from .problems import *


def resolve_cable_stitches(data, width):
    """
    Replaces cable stitches with move stitches
    :return:
    """

    # Build a list of possible pairs and stitches
    cable_pairs = [
        [4, 5], [5, 4],
        [5, 10], [10, 5],
        [14, 15], [15, 14],
        [15, 100], [100, 15]
    ]
    cable_stitches = [item for sublist in cable_pairs for item in sublist]

    # Problems with the data will be stored here
    problems: [KnitPaintCheckProblem] = []

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
                    first_cable_lower = first_cable_color == 10 or first_cable_color == 100
                    second_cable_lower = second_cable_color == 10 or second_cable_color == 100

                    if first_cable_width > MAX_CABLE_THRESH or second_cable_width > MAX_CABLE_THRESH:
                        # The cable exceeds the maximum size. Create a syntax error
                        problem = OversizedCableError(course, first_cable_start)
                        problems.append(problem)
                    else:
                        # Do the replacement
                        first_move = cable_width - first_cable_width
                        second_move = cable_width - second_cable_width
                        first_replacement = 70 + first_move + (20 if first_cable_lower else 0)
                        second_replacement = 60 + second_move + (20 if second_cable_lower else 0)
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
        raise KnitPaintCheckException(problems)

    return processed_data
