import numpy as np
from .constants import default_color_labels


def find_categories_by_keyword(keywords):
    """
    Checks the default_color_labels for matches with the keywords
    :param keywords: List of keywords to be matched
    :return: Indices of default_color_labels, that contain at least one of the keywords.
             If no match is found [-1] is returned.
    """

    # Search for matches of every keyword in color_label list and append to color_label_indices
    color_label_indices = []
    for keyword in keywords:
        for label_index in range(len(default_color_labels)):
            if keyword in default_color_labels[label_index]:
                color_label_indices.append(label_index)

    # Delete duplicates in the labels to receive a unique index listing
    color_label_indices = np.unique(color_label_indices)

    # Return -1 if no keyword match was found in the labels, else return the label indices
    if len(color_label_indices == 0):
        return [-1]
    else:
        return color_label_indices


def check_syntax(src, maximum_tucks: int, verbose=True):
    """
    Checks current bitmap data for syntactical correctness
    :param src: KnitPaint class to check
    :param maximum_tucks: Maximum number of allowed subsequent tucks in the same column
    :param verbose: Set to false if errors should not be logged
    :return: True if syntax correct, False if syntax is incorrect
    """
    syntax_check = True
    bitmap_width = src.get_width()
    bitmap_height = src.get_height()
    bitmap_np = np.array(src.bitmap_data)
    bitmap_np_shaped = np.reshape(bitmap_np, (bitmap_height, bitmap_width))

    # Check1: Knit: 1: Total courses must be even number
    if not bitmap_height % 2 == 0:
        syntax_check = False
        if verbose:
            print('Error: Current Bitmap data did not pass the syntax check: '
                  + 'Total courses number is ' + str(bitmap_height) + ' and should be an even number.')

    # Check2: Knit: 2: Always check carrier position after ending
    # ...

    # Check3: Tuck: 1: Do not tuck on the ending needle
    for line_index in range(bitmap_height):
        # Check if there is a tuck on an ending needle for each line in the bitmap data
        if (
                bitmap_np_shaped[line_index][0] in find_categories_by_keyword(['tuck'])
                or bitmap_np_shaped[line_index][src.get_width() - 1] in find_categories_by_keyword(['tuck'])
        ):
            syntax_check = False
            if verbose:
                print('Error: Current Bitmap data did not pass the syntax check: '
                      + 'Tuck on ending needle in numpy bitmap line ' + str(line_index + 1) + ' detected. '
                      + 'Do not tuck on the ending needle')

    # Check4: Tuck: 2: Do not tuck more than x (depends on yarn)
    for column_index in range(bitmap_width):
        tucks_in_row = 0
        for line_index in range(bitmap_height):

            # Sum up the tucks appended continuous in a column
            if bitmap_np_shaped[line_index][column_index] in find_categories_by_keyword(['tuck']):
                tucks_in_row += 1
            else:
                tucks_in_row = 0

            # If number of continuous tucks exceeds the maximum number, the syntax is not correct
            if tucks_in_row > maximum_tucks:
                syntax_check = False
                if verbose:
                    print('Error: Current Bitmap data did not pass the syntax check: '
                          + 'Maximum number of tucks in row exceeded in numpy bitmap column ' + str(line_index + 1)
                          + ' and line ' + str(column_index + 1) + '. Do not do more tucks than '
                          + str(maximum_tucks) + ' per column.')

    # Check5: Miss: 1: if miss >= course; Color0 = Color16; Color13 = Color16
    for line_index in range(3, bitmap_height - 3):
        # Check if there is a whole line of misses in the bitmap data, that was not set to Color16
        # and the whole line of misses is not in the first or last 3 lines of the normalized Bitmap data
        if (
                (bitmap_np_shaped[line_index] == [0] * bitmap_width).all()
                or (bitmap_np_shaped[line_index] == [13] * bitmap_width).all()
        ):
            syntax_check = False
            if verbose:
                print('Error: Current Bitmap data did not pass the syntax check: '
                      + 'Complete line of misses in line ' + str(line_index + 1) + ' detected. '
                      + 'Do not do only misses in a line with \'miss\' or \'auto yarn feeder point\'.'
                      + 'Should have been set to \'no needle selection\' before knitting.')

    # Check6: Transfer/Receive: 1: In stitch move, the overlapped and pick up stitch might be unstable
    # ...

    # Check7: Transfer/Receive: 2: Rack_Right -> transfter_Single -> rack_Left -> transfer_Double is unstable. Do:
    # 	ack_Left ->transfter_Single -> rack_Right -> transfer_Single
    # ...

    # Check8: Transfer / Receive: 3: Use Color30/20 to link from two bed to one bed
    # ...

    # Check9: Transfer / Receive: 4: Use Color30/20 to link from two bed to one bed
    # ...

    # Check10: Transfer / Receive: 5: Color80/90 override the option line R9.
    #                                Do not draw the line only with Color80/90
    # ...

    # Check11: Racking: 1: Racking for transfer does not need to specify on L2, L3, L4
    # ...

    # Check12: Racking: 2: Cross stitch comes in pair
    # Defining the labels of cross stitches that have to be in pairs for set1 and set2
    color_labels_cross_lower_1 = [4, 10]
    color_labels_cross_upper_1 = [5]
    color_labels_cross_lower_2 = [14, 100]
    color_labels_cross_upper_2 = [15]
    for line_index in range(bitmap_height):
        # Check if cross stitches are in the current line of numpy Bitmap data and set the corresponding boolean
        cross_lower_set_1 = False
        cross_upper_set_1 = False
        cross_lower_set_2 = False
        cross_upper_set_2 = False

        for color_label in color_labels_cross_lower_1:
            if color_label in bitmap_np_shaped[line_index]:
                cross_lower_set_1 = True

        for color_label in color_labels_cross_upper_1:
            if color_label in bitmap_np_shaped[line_index]:
                cross_upper_set_1 = True

        for color_label in color_labels_cross_lower_2:
            if color_label in bitmap_np_shaped[line_index]:
                cross_lower_set_2 = True

        for color_label in color_labels_cross_upper_2:
            if color_label in bitmap_np_shaped[line_index]:
                cross_upper_set_2 = True

        # If any cross stitch does not appear in a pair, the syntax is not correct
        if (cross_lower_set_1 ^ cross_upper_set_1) or (cross_lower_set_2 ^ cross_upper_set_2):
            syntax_check = False
            if verbose:
                print('Error: Current Bitmap data did not pass the syntax check: '
                      + 'Single category of cross stitch in line ' + str(line_index + 1) + ' detected. '
                      + 'Cross stitches have to come in pairs.')

    # Check13: Transfer: Transfer stitches have to come in pairs in the same column
    for column_index in range(bitmap_width):
        transfer_counter = 0
        transfer_in_last_line = False

        for line_index in range(bitmap_height):

            # Sum up the transfers appended continuous in a column with +1 for front knit and -1 for back knit
            if (bitmap_np_shaped[line_index][column_index]
                    in find_categories_by_keyword(['Front knit + transfer'])):
                transfer_counter += 1
                transfer_in_last_line = True

            elif (bitmap_np_shaped[line_index][column_index]
                  in find_categories_by_keyword(['Back knit + transfer'])):
                transfer_counter -= 1
                transfer_in_last_line = True

            else:
                # If the current stitch type is not a transfer and there was a transfer stitch in the last line,
                # the syntax of this pattern is not correct
                if transfer_in_last_line:
                    syntax_check = False

                    if verbose:
                        print('Error: Current Bitmap data did not pass the syntax check: '
                              + 'Some transfers in column ' + str(column_index + 1) + ' were not transfered back'
                              + '. Transfer stitches have to appear in pairs within'
                              + ' the following line of front/back + transfer stitches.')

            # If the current sum of transfer stitches is 0, the transfer stitches are balanced and for the syntax
            # check for the current column it can be seen as if there were no transfers at all
            if transfer_counter == 0:
                transfer_in_last_line = False

            # If the transfer counter is greater/smaller +1/-1 there have been two transfers of same type front/back
            # in a row, which in general should not be syntactical correct
            if abs(transfer_counter) > 1:
                syntax_check = False

                if verbose:
                    print('Error: Current Bitmap data did not pass the syntax check: '
                          + 'Maximum number of transfers in row exceeded in numpy bitmap column '
                          + str(line_index + 1) + ' and line ' + str(column_index + 1)
                          + '. Transfer stitches have to be transfered back in the next command line.')

        # If the total number of transfers at the end of a column is not 0, there have been transfers
        # not appearing in a pair of front/back, which is not syntactical correct
        if not transfer_counter == 0:
            syntax_check = False

            if verbose:
                print('Error: Current Bitmap data did not pass the syntax check: '
                      + 'Some transfers in column ' + str(column_index + 1) + ' were not transfered back'
                      + '. Transfer stitches have to appear in pairs of front/back + transfer.')
    return syntax_check
