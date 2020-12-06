import numpy as np
import cv2


def write_image(src, output_filename, verbose=True):
    """
    Builds a preview image of the provided KnitPaint file using Numpy and OpenCV
    :param src: KnitPaint source
    :param output_filename:
    :param verbose: Set to False to disable logging on success
    :return:
    """
    bitmap_np = src.get_np_bitmap_data(bottom_to_top=True)
    bitmap_lut = np.array(src.color_table)
    image_rgb = bitmap_lut[bitmap_np]
    image_bgr = image_rgb[:, :, ::-1]
    cv2.imwrite(output_filename, image_bgr)
    if verbose:
        print('Saved preview image to ' + output_filename)
