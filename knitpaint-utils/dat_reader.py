import io

HEADER_LENGTH = 64
BODY_SIZE_LENGTH = 4
LZSS_N = 4096
LZSS_F = 18


def read_dat(input_file, dst=None):
    """
    Reads all information from the provided dat file or bytes
    :param input_file: filename or byte array
    :param dst: Destination KnitPaint class
    :return:
    """
    if isinstance(input_file, str):
        return read_dat_file(input_file, dst=dst)
    else:
        return read_dat_bytes(input_file, dst=dst)


def read_dat_file(input_filename, dst=None):
    """
    Reads all information from the provided dat file
    :param input_filename:
    :param dst: Destination KnitPaint class
    :return:
    """
    dat_bytes = open(input_filename, "rb").read()
    return read_dat_bytes(dat_bytes, dst=dst)


def read_dat_bytes(dat_bytes, dst=None):
    """
    Reads all information from the provided dat bytes
    :param dat_bytes:
    :param dst: Destination KnitPaint class
    :return:
    """
    if dst is None:
        from . import KnitPaint
        dst = KnitPaint()

    # Check if file needs to be decompressed
    compress_text = "SDS LZSS COMPRESS Ver 1.00"
    compress_bytes = compress_text.encode()
    if compress_bytes == dat_bytes[0:len(compress_bytes)]:
        dat_bytes = decompress_dat_bytes(dat_bytes)

    raise NotImplementedError('Confidential')


def decompress_dat_bytes(dat_bytes):
    """
    Decompresses the bytes provided and returns the decompressed bytes
    :param dat_bytes:
    :return:
    """
    raise NotImplementedError('Confidential')
