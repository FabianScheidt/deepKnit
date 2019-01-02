import numpy as np
import cv2


def read_image(image_filename, dst=None):
    """
    Creates new bitmap data by finding the correct color numbers from an image
    :param image_filename:
    :param dst: KnitPaint destination
    :return:
    """
    if dst is None:
        from . import KnitPaint
        dst = KnitPaint()

    # Read image and bring it into the correct shape
    image_bgr = cv2.imread(image_filename, cv2.IMREAD_COLOR)
    image_rgb = image_bgr[:, :, ::-1]
    height, width, _ = image_rgb.shape
    colors = image_rgb.reshape((width * height, 3))

    # Search for matching color numbers for each color use the nearest color if the color is not in the list
    def find_nearest_color_number(color):
        nearest_index = None
        nearest_distance = None
        for index, color_table_item in enumerate(dst.color_table):
            distance = np.linalg.norm(color - np.array(color_table_item))
            if nearest_distance is None or distance < nearest_distance:
                nearest_index = index
                nearest_distance = distance
            if distance == 0:
                break
        return nearest_index

    color_numbers = np.apply_along_axis(find_nearest_color_number, 1, colors)

    # Reshape the result and set it
    bitmap_data = color_numbers.reshape((height, width))
    dst.set_np_bitmap_data(bitmap_data, bottom_to_top=True)
    return dst
