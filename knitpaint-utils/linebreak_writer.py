def write_linebreak(src, output_filename=None, linebreak_char=None, verbose=True):
    """
    Saves the bitmap data to a file. Optionally adds a linebreak character in advance.
    Returns the data if no filename is provided
    :param src:
    :param output_filename:
    :param linebreak_char:
    :param verbose:
    :return:
    """
    # Create a copy of the knitpaint and add the linebreak
    if linebreak_char is not None:
        from . import KnitPaint
        src = KnitPaint(src.get_np_bitmap_data())
        src.add_char_col(linebreak_char)

    # Extract the result, return it if no output filename is provided
    output_bytes = bytearray(src.bitmap_data)
    if output_filename is None:
        return output_bytes

    # Write to disk
    with open(output_filename, "w+b") as file:
        file.write(output_bytes)
        file.close()
        if verbose:
            print('Saved training data to ' + output_filename)