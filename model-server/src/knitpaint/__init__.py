import numpy as np
from .constants import default_color_table
from .dat_reader import read_dat
from .dat_writer import write_dat
from .lep_reader import read_lep
from .linebreak_reader import read_linebreak
from .linebreak_writer import write_linebreak
from .image_reader import read_image
from .image_writer import write_image
from .normalize import normalize_bitmap_data
from .syntax_check import check_syntax
from .check import check


class KnitPaint:
    """
    Represents a KnitPaint file with all its attributes following the dat specification
    """

    def __init__(self, input_file=None):
        """
        Initializes an instance by either reading the file with the provided filename, loading the provided numpy array
        or using default values

        :param input_file:
        Can be any of the following
        - String representing the path to a dat, lep or image file
        - Byte-Array containing the contents of a dat file
        - numpy.ndarray containing the bitmap-data
        """
        # Default header
        self.header_x_start = 0
        self.header_y_start = 0
        self.header_x_end = 490
        self.header_y_end = 406

        # Default color table
        self.color_table = default_color_table

        # Default resolution
        self.resolution_valid = 0
        self.resolution_x_den = 0
        self.resolution_x_nom = 0
        self.resolution_y_den = 0
        self.resolution_y_nom = 0

        # Default bitmap-data: all black
        self.bitmap_data = [0] * (490 * 406)

        # Read input file if given
        if input_file is not None:
            if isinstance(input_file, np.ndarray):
                self.set_np_bitmap_data(input_file)
            elif isinstance(input_file, str):
                if input_file.lower().endswith('dat'):
                    self.read_dat(input_file)
                elif input_file.lower().endswith('lep'):
                    self.read_lep(input_file)
                else:
                    self.read_image(input_file)
            else:
                self.read_dat(input_file)

    def __eq__(self, other):
        """
        Two KnitPaint objects should be considered equal if all attributes are equal
        :param other:
        :return:
        """
        for key in self.__dict__.keys():
            if key not in other.__dict__ or self.__dict__[key] != other.__dict__[key]:
                print(key)
                return False
        return True

    def set_bitmap_data(self, bitmap_data, width, height):
        """
        Sets new bitmap data and updates the header information
        :param bitmap_data:
        :param width:
        :param height:
        :return:
        """
        if len(bitmap_data) == width*height:
            self.bitmap_data = bitmap_data
            self.header_x_end = self.header_x_start + width - 1
            self.header_y_end = self.header_y_start + height - 1
        else:
            print('Error: Bitmap data was not set because the dimensions were incorrect. '
                  + 'Bitmap data length is ' + str(len(bitmap_data)) + ' and should be ' + str(width*height) + '.')

    def set_np_bitmap_data(self, bitmap_data, bottom_to_top=False):
        """
        Sets new bitmap data from a numpy array

        :param bitmap_data:
        Numpy array containing the bitmap data. The array should have two dimensions and contain only integers from
        0 to 255.

        :param bottom_to_top:
        Defines if instructions in the matrix go from bottom to top. Set this to true if the matrix has the same
        orientation as a preview image.

        :return:
        """
        if bottom_to_top:
            bitmap_data = np.flipud(bitmap_data)
        new_bitmap_data = list(bitmap_data.flatten().tolist())
        height, width = bitmap_data.shape
        self.set_bitmap_data(new_bitmap_data, width, height)

    def read_dat(self, input_file):
        """
        Reads all information from the provided dat file or bytes
        :param input_file: filename or byte array
        :return:
        """
        return read_dat(input_file, dst=self)

    def write_dat(self, output_filename=None):
        """
        Saves the current data as knitpaint dat file.
        Returns the data if no filename is provided
        :param output_filename:
        :return:
        """
        return write_dat(self, output_filename)

    def read_lep(self, input_file):
        """
        Reads all information from the provided lep file
        :param input_file:
        :return:
        """
        read_lep(input_file, dst=self)

    def read_linebreak(self, input_file, linebreak_char, target_width=None, target_height=None):
        """
        Creates new bitmap data by separating lines using the provided linebreak character
        :param input_file:
        :param linebreak_char:
        :param target_width:
        :param target_height:
        :return:
        """
        return read_linebreak(input_file, linebreak_char, target_width=target_width,
                              target_height=target_height, dst=self)

    def write_linebreak(self, output_filename=None, linebreak_char=None, verbose=True):
        """
        Saves the bitmap data to a file. Optionally adds a linebreak character in advance.
        Returns the data if no filename is provided
        :param output_filename:
        :param linebreak_char:
        :param verbose:
        :return:
        """
        write_linebreak(self, output_filename=output_filename, linebreak_char=linebreak_char, verbose=verbose)

    def read_image(self, image_filename):
        """
        Creates new bitmap data by finding the correct color numbers from an image
        :param image_filename:
        :return:
        """
        return read_image(image_filename, dst=self)

    def write_image(self, output_filename, verbose=True):
        """
        Builds a preview image of the provided KnitPaint file using Numpy and OpenCV
        :param output_filename:
        :param verbose: Set to False to disable logging on success
        :return:
        """
        write_image(self, output_filename, verbose)

    def get_width(self):
        """
        Returns the width derived from the header information
        :return:
        """
        return self.header_x_end - self.header_x_start + 1

    def get_height(self):
        """
        Returns the height derived from the header information
        :return:
        """
        return self.header_y_end - self.header_y_start + 1

    def get_np_bitmap_data(self, bottom_to_top=False):
        """
        Returns the bitmap data as a numpy matrix

        :param bottom_to_top:
        Defines if instructions should go from bottom to top. Set this to true if you want the matrix to have the same
        appearance as the preview image.

        :return:
        """
        current_height = self.get_height()
        current_width = self.get_width()
        bitmap_np = np.array(self.bitmap_data, dtype=int)
        bitmap_np_shaped = np.reshape(bitmap_np, (current_height, current_width))
        if bottom_to_top:
            bitmap_np_shaped = np.flipud(bitmap_np_shaped)
        return bitmap_np_shaped

    def normalize_bitmap_data(self, has_option_line=True, option_line='keep'):
        """
        Crops the bitmap data by removing all the "black" around the edges. Optionally modifies the option line
        Option line can be kept, removed or replaced with the default option line.
        Modifies the bitmap data in place.

        :param has_option_line:
        Set to True if the current bitmap data contains an option line

        :param option_line:
        Set to 'keep' if no change to the option line should be made.
        Set to 'remove' to remove the existing option line.
        Set to 'default' to remove existing option lines and replace them with the default option line.

        :return:
        """
        return normalize_bitmap_data(self, has_option_line=has_option_line, option_line=option_line)

    def add_col(self, col, right=True):
        """
        Adds a column to the right (or left) side of the bitmap data
        :param col:
        :param right:
        :return:
        """
        np_bitmap_data = self.get_np_bitmap_data()
        if right:
            new_bitmap_data = np.hstack((np_bitmap_data, col))
        else:
            new_bitmap_data = np.hstack((col, np_bitmap_data))
        self.set_np_bitmap_data(new_bitmap_data)

    def add_char_col(self, char, right=True):
        """
        Adds a column with the provided character to the right (or left) side of the bitmap data
        :param char:
        :param right:
        :return:
        """
        height = self.get_height()
        char_col = (np.ones((height, 1)) * char).astype(int)
        self.add_col(char_col, right)

    def find_unused_chars(self):
        """
        Finds characters (here represented by ints from 0 to 255) that are not present in the bitmap data
        For good measure these characters should be greater or equal to 151
        :return:
        """
        np_bitmap_data = self.get_np_bitmap_data().flatten()
        used_chars = np.unique(np_bitmap_data)
        all_chars = np.arange(151, 255, 1)
        unused_chars = np.setdiff1d(all_chars, used_chars)
        return unused_chars.tolist()

    def check_syntax(self, maximum_tucks: int, verbose=True):
        """
        Checks current bitmap data for syntactical correctness
        :param maximum_tucks: Maximum number of allowed subsequent tucks in the same column
        :param verbose: Set to false if errors should not be logged
        :return: True if syntax correct, False if syntax is incorrect
        """
        return check_syntax(self, maximum_tucks, verbose)
