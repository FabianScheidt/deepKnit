def write_dat(src, output_file=None):
    """
    Saves the provided data as knitpaint dat file.
    Returns the data if no filename is provided
    :param src:
    :param output_file:
    :return:
    """
    if output_file is None:
        return get_dat_bytes(src)
    else:
        save_dat_file(src, output_file)


def get_dat_bytes(src):
    """
    Converts the provided knitpaint data to a dat file and returns the bytes
    :return:
    """
    raise NotImplementedError('Confidential')


def save_dat_file(src, output_filename, verbose=True):
    """
    Saves the provided knitpaint data as dat file
    :param src: KnitPaint class to be saved
    :param output_filename:
    :param verbose: Set to false to disable message on success
    :return:
    """
    # Get bytes
    dat_bytes = get_dat_bytes(src)

    # Write file
    with open(output_filename, "w+b") as file:
        file.write(dat_bytes)
        file.close()
        if verbose:
            print('Saved dat to ' + output_filename)
