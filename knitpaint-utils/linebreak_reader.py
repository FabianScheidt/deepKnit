def read_linebreak(input_file, linebreak_char, padding_char=0, target_width=None, target_height=None, dst=None):
    """
    Creates new bitmap data by separating lines from the input using the provided linebreak character
    :param input_file:
    :param linebreak_char:
    :param padding_char:
    :param target_width:
    :param target_height:
    :param dst:
    :return:
    """
    if isinstance(input_file, str):
        return read_linebreak_file(input_file, linebreak_char=linebreak_char, padding_char=padding_char,
                                   target_width=target_width, target_height=target_height, dst=dst)
    else:
        return read_linebreak_bytes(input_file, linebreak_char=linebreak_char, padding_char=padding_char,
                                    target_width=target_width, target_height=target_height, dst=dst)


def read_linebreak_file(input_filename, linebreak_char, padding_char=0, target_width=None, target_height=None, dst=None):
    """
    Creates new bitmap data by separating lines from the input file using the provided linebreak character
    :param input_filename:
    :param linebreak_char:
    :param padding_char:
    :param target_width:
    :param target_height:
    :param dst:
    :return:
    """
    linebreak_bytes = open(input_filename, "rb").read()
    return read_linebreak_bytes(linebreak_bytes, linebreak_char=linebreak_char, padding_char=padding_char,
                                target_width=target_width, target_height=target_height, dst=dst)


def read_linebreak_bytes(input_bytes, linebreak_char, padding_char=0, target_width=None, target_height=None, dst=None):
    """
    Creates new bitmap data by separating lines using the provided linebreak character
    :param input_bytes:
    :param linebreak_char:
    :param padding_char:
    :param target_width:
    :param target_height:
    :param dst: Destination KnitPaint class
    :return:
    """
    if dst is None:
        from . import KnitPaint
        dst = KnitPaint()

    # Read lines
    lines = []
    current_line = []
    width = 0
    for bitmap_element in input_bytes:
        if bitmap_element == linebreak_char:
            if len(current_line) > width:
                width = len(current_line)
            lines.append(current_line)
            current_line = []
        else:
            current_line.append(bitmap_element)
    if len(current_line) > 0:
        if len(current_line) > width:
            width = len(current_line)
        lines.append(current_line)

    # Allow to set a predefined width and height
    if target_width is not None:
        width = target_width

    if target_height is not None:
        lines = lines[:target_height]
        lines += [[]] * (target_height - len(lines))

    # Make lines all the same length by padding the right side with black and concatenate to build new bitmap data
    new_bitmap_data = []
    for current_line in lines:
        current_line = current_line[:width]
        current_line += [padding_char] * (width - len(current_line))
        new_bitmap_data += current_line

    # Set the new bitmap data
    dst.set_bitmap_data(new_bitmap_data, width, len(lines))
    return dst
