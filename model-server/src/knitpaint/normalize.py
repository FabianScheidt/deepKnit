import numpy as np


def normalize_color_numbers(dst):
    """
    Replaces redundant color numbers with a normalized number
    :param dst:
    :return:
    """
    dst.bitmap_data = [6 if c == 61 else c for c in dst.bitmap_data]
    dst.bitmap_data = [7 if c == 71 else c for c in dst.bitmap_data]
    dst.bitmap_data = [8 if c == 81 else c for c in dst.bitmap_data]
    dst.bitmap_data = [9 if c == 91 else c for c in dst.bitmap_data]
    return dst


def normalize_bitmap_data(dst, has_option_line=True, option_line='keep'):
    """
    Crops the bitmap data by removing all the "black" around the edges. Optionally modifies the option line
    Option line can be kept, removed or replaced with the default option line.
    Modifies the destination bitmap data in place.

    :param dst:
    KnitPaint object to be normalized

    :param has_option_line:
    Set to True if the current bitmap data contains an option line

    :param option_line:
    Set to 'keep' if no change to the option line should be made.
    Set to 'remove' to remove the existing option line.
    Set to 'default' to remove existing option lines and replace them with the default option line.

    :return:
    """

    # Convert into a numpy array for easier handling
    bitmap_np = dst.get_np_bitmap_data()

    # Crop to the option line (if available) and crop the knitpaint itself
    if has_option_line:
        bitmap_np = _normalize_np_bitmap_data(bitmap_np, 'purple')
        knitpaint = _normalize_np_bitmap_data(bitmap_np[:, 42:-42])
    else:
        knitpaint = _normalize_np_bitmap_data(bitmap_np)

    # Figure out which option line to use
    if has_option_line and option_line == 'keep':
        options_left = bitmap_np[:, :42]
        options_right = bitmap_np[:, -42:]
    elif option_line == 'default':
        default_left = np.array([[0, 0, 0, 20, 0, 19, 0, 18, 0, 17, 0, 16, 0, 15, 0, 14, 0, 13, 0, 12, 1,
                                  11, 4, 10, 0, 9, 0, 8, 0, 7, 0, 6, 0, 5, 0, 4, 0, 3, 0, 2, 0, 1]], dtype=int)
        default_right = np.array([[1, 0, 2, 0, 3, 6, 4, 0, 5, 0, 6, 0, 7, 0, 8, 0, 9, 0, 10, 0, 11, 1, 12,
                                   0, 13, 0, 14, 0, 15, 0, 16, 0, 17, 0, 18, 0, 19, 0, 20, 0, 0, 0]], dtype=int)
        options_left = np.tile(default_left, (knitpaint.shape[0], 1))
        options_right = np.tile(default_right, (knitpaint.shape[0], 1))
    else:
        options_left = np.zeros((knitpaint.shape[0], 0), dtype=int)
        options_right = np.zeros((knitpaint.shape[0], 0), dtype=int)

    # Reassemble the pieces with a 3 pixel spacer
    v_spacer = np.zeros((knitpaint.shape[0], 3), dtype=int)
    bitmap_normalized = np.hstack((options_left, v_spacer, knitpaint, v_spacer, options_right))

    # Add a 3 pixel horizontal spacing
    h_spacer = np.zeros((3, bitmap_normalized.shape[1]), dtype=int)
    bitmap_normalized = np.vstack((h_spacer, bitmap_normalized, h_spacer))

    # Set the new data
    dst.set_np_bitmap_data(bitmap_normalized)
    return dst


def _normalize_np_bitmap_data(np_bitmap_data, mode='black'):
    """
    Crops the provided numpy bitmap by finding the black or purple edges and cropping according to them
    :param np_bitmap_data:
    :param mode: can either be 'black' or 'purple'
    :return:
    """
    list_bitmap_data = np_bitmap_data.flatten().tolist()

    # The top left and bottom right corners will always have a color, so find them
    first_colored_index = None
    last_colored_index = None
    for index, byte in enumerate(list_bitmap_data):
        if (mode == 'black' and byte != 0) or (mode == 'purple' and byte == 20):
            last_colored_index = index
            if first_colored_index is None:
                first_colored_index = index

    if first_colored_index is None or last_colored_index is None:
        raise AssertionError('Normalization failed. Expected to find edges.')

    # Figure out the dimensions of the sliced image
    current_height, current_width = np_bitmap_data.shape
    first_colored_x = first_colored_index % current_width
    first_colored_y = int(first_colored_index / current_width)
    last_colored_x = last_colored_index % current_width
    last_colored_y = int(last_colored_index / current_width)

    if mode == 'purple':
        first_colored_x = first_colored_x - 3
        last_colored_x = last_colored_x + 3

    # Perform the slicing and return the result
    normalized = np_bitmap_data[first_colored_y:last_colored_y + 1, first_colored_x:last_colored_x + 1]
    return normalized
