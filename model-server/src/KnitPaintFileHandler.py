import numpy as np
import cv2
import io


class KnitPaintFileHandler:
    # Default header
    header_x_start = 0
    header_y_start = 0
    header_x_end = 490
    header_y_end = 406

    # Default color table
    color_table = [
        [0, 0, 0], [255, 0, 0], [0, 255, 0], [255, 255, 0], [0, 0, 255], [255, 0, 255], [0, 255, 255], [255, 255, 255],
        [74, 137, 153], [108, 36, 144], [180, 180, 216], [255, 103, 189], [144, 108, 180], [153, 153, 153],
        [207, 144, 192], [128, 128, 255], [81, 255, 222], [82, 145, 219], [0, 124, 145], [235, 235, 36],
        [178, 118, 178], [252, 180, 108], [252, 148, 99], [252, 108, 72], [252, 216, 252], [252, 180, 252],
        [216, 144, 252], [100, 200, 200], [160, 102, 0], [235, 172, 235], [115, 115, 178], [144, 216, 72],
        [115, 178, 115], [157, 127, 1], [235, 235, 172], [216, 216, 72], [180, 180, 108], [255, 0, 160],
        [215, 195, 225], [172, 172, 235], [127, 0, 127], [216, 72, 144], [144, 108, 216], [216, 216, 252],
        [216, 180, 216], [202, 167, 225], [188, 154, 70], [174, 141, 245], [159, 127, 255], [128, 96, 255],
        [220, 118, 117], [255, 144, 144], [192, 255, 144], [252, 252, 180], [252, 252, 144], [216, 252, 72],
        [255, 144, 207], [144, 255, 192], [180, 144, 144], [253, 235, 199], [160, 255, 255], [0, 255, 255],
        [50, 233, 233], [50, 202, 233], [53, 175, 237], [0, 213, 0], [216, 108, 216], [216, 108, 180],
        [192, 96, 180], [168, 84, 180], [153, 102, 255], [255, 255, 255], [0, 160, 160], [183, 188, 188],
        [197, 174, 183], [226, 197, 178], [192, 255, 207], [144, 207, 192], [144, 216, 252], [144, 180, 252],
        [0, 112, 153], [74, 137, 153], [109, 165, 180], [144, 192, 207], [0, 102, 255], [0, 153, 255], [51, 173, 255],
        [102, 193, 255], [153, 214, 255], [133, 122, 3], [202, 40, 145], [120, 48, 156], [144, 72, 180],
        [180, 108, 216], [255, 0, 143], [125, 143, 165], [255, 102, 187], [255, 153, 210], [105, 63, 36], [127, 0, 0],
        [129, 100, 12], [250, 163, 185], [172, 235, 172], [252, 216, 108], [178, 178, 115], [127, 127, 0],
        [180, 144, 72], [180, 108, 108], [212, 149, 149], [180, 216, 216], [144, 108, 108], [255, 191, 191],
        [192, 207, 144], [255, 207, 144], [115, 178, 178], [192, 144, 207], [169, 229, 231], [216, 216, 180],
        [180, 216, 144], [191, 106, 105], [144, 216, 252], [255, 221, 173], [178, 115, 115], [216, 180, 108],
        [0, 0, 127], [170, 0, 0], [0, 150, 0], [216, 157, 73], [144, 101, 253], [251, 253, 254], [157, 90, 111],
        [129, 223, 165], [172, 172, 255], [55, 157, 127], [191, 223, 190], [221, 243, 123], [63, 110, 17],
        [185, 247, 171], [215, 219, 255], [239, 255, 103], [253, 251, 85], [222, 255, 185], [115, 171, 127],
        [254, 251, 157], [141, 199, 222], [47, 49, 251], [255, 175, 127], [251, 250, 127], [237, 175, 251],
        [254, 106, 127], [245, 157, 147], [6, 3, 240], [237, 234, 251], [234, 254, 254], [61, 159, 191], [173, 12, 235],
        [250, 167, 93], [252, 222, 239], [253, 125, 252], [239, 245, 247], [141, 199, 222], [102, 0, 138],
        [122, 103, 150], [127, 255, 255], [121, 127, 189], [95, 191, 58], [113, 135, 187], [155, 127, 223],
        [238, 206, 61], [255, 252, 248], [255, 47, 207], [168, 191, 176], [219, 190, 254], [159, 111, 158],
        [255, 253, 253], [245, 186, 95], [243, 95, 217], [205, 242, 243], [254, 223, 147], [224, 45, 255],
        [121, 127, 189], [200, 200, 200], [31, 181, 55], [115, 91, 170], [229, 111, 129], [191, 119, 253],
        [246, 219, 190], [243, 143, 127], [222, 126, 127], [224, 146, 255], [204, 95, 145], [240, 240, 240],
        [100, 157, 76], [75, 255, 75], [161, 186, 75], [64, 64, 64], [26, 236, 206], [247, 247, 103], [103, 251, 169],
        [224, 109, 255], [100, 100, 255], [255, 100, 125], [63, 227, 211], [245, 150, 100], [239, 247, 247],
        [151, 199, 111], [150, 255, 247], [20, 211, 180], [103, 127, 207], [215, 175, 173], [238, 246, 233],
        [183, 245, 252], [234, 247, 127], [186, 115, 205], [189, 90, 175], [108, 178, 129], [78, 136, 247],
        [38, 95, 100], [47, 183, 245], [100, 137, 81], [159, 253, 125], [191, 188, 164], [243, 233, 63],
        [127, 127, 223], [255, 126, 247], [170, 127, 207], [191, 250, 249], [230, 47, 253], [235, 247, 223],
        [87, 124, 127], [254, 165, 77], [6, 3, 240], [237, 234, 251], [79, 199, 95], [239, 141, 251], [106, 251, 255],
        [183, 255, 223], [98, 255, 79], [207, 91, 240], [221, 121, 169], [107, 231, 69], [102, 0, 138], [122, 103, 150],
        [178, 141, 186], [247, 236, 189], [90, 185, 252], [76, 247, 183], [156, 89, 9], [157, 189, 242], [150, 0, 0],
        [0, 175, 0], [0, 150, 0], [200, 0, 0], [110, 0, 0], [100, 100, 100], [0, 125, 0]
    ]

    # Default color labels
    color_labels = [
        'Miss',
        'Front knit (jersey)',
        'Back knit (reversed jersey)',
        'Front / back knit',
        'Normal stich knit (lower) [Front stich cross(1)]',
        'Normal stich knit (upper) [Front stich cross(1)] / [Front-Back stich cross(1)]',
        'Front knit + move 1P left',
        'Front knit + move 1P right',
        'Back knit + move 1P left',
        'Back knit + move 1P right',
        'Reverse stich knit (lower) [Front-Back stich cross(1)]',
        'Front tuck',
        'Back tuck',
        'Auto yarn feeder point',
        'Normal stich knit (lower) [Front stich cross(2)]',
        'Normal stich knit (upper) [Front stich cross(2)] / [Front-Back stich cross(2)]',
        'No needle selection',
        'Front knit (with kick back process)',
        'Back knit (with kick back process)',
        '',
        'Front knit + transfer',
        'Front knit + transfer 1P left',
        'Front knit + transfer 2P left',
        'Front knit + transfer 3P left',
        'Front knit + transfer 1P right',
        'Front knit + transfer 2P right',
        'Front knit + transfer 3P right',
        'Front knit for 2nd stich (-)',
        'Back knit for 2nd stich (-)',
        'Front knit + transfer',
        'Back knit + transfer',
        'Back knit + transfer 1P left',
        'Back knit + transfer 2P left',
        'Back knit + transfer 3P left',
        'Back knit + transfer 1P right',
        'Back knit + transfer 2P right',
        'Back knit + transfer 3P right',
        'Front knit for 2nd stich (+)',
        'Back knit for 2nd stich (+)',
        'Back knit + transfer',
        'Front knit + transfer',
        'Front knit, knit + receive assistance (back) (without links process)',
        'Knit + receive assistance (front), back knit (without links process)',
        'Front knit + transfer 4P left',
        'Front knit + transfer 5P left',
        'Front knit + transfer 6P left',
        'Front knit + transfer 7P left',
        'Front knit + transfer 4P right',
        'Front knit + transfer 5P right',
        'Front knit + transfer 6P right',
        'Back knit + transfer',
        'Front knit (without links process)',
        'Back knit (without links process)',
        'Back knit + transfer 4P left',
        'Back knit + transfer 5P left',
        'Back knit + transfer 6P left',
        'Back knit + transfer 7P left',
        'Back knit + transfer 4P right',
        'Back knit + transfer 5P right',
        'Back knit + transfer 6P right',
        '',
        'Front knit + move 1P left',
        'Front knit + move 2P left',
        'Front knit + move 3P left',
        'Front knit + move 4P left',
        'Front miss + move 1P left',
        'Front miss + move 2P left',
        'Front miss + move 4P left',
        'Front knit + transfer 7P right',
        'Back knit + transfer 7P right',
        '',
        'Front knit + move 1P right',
        'Front knit + move 2P right',
        'Front knit + move 3P right',
        'Front knit + move 4P right',
        'Front miss + move 1P right',
        'Front miss + move 2P right',
        'Front miss + move 4P right',
        '', '', '',
        'Back knit + move 1P left',
        'Back knit + move 2P left',
        'Back knit + move 3P left',
        'Back knit + move 4P left',
        'Back miss + move 1P left',
        'Back miss + move 2P left',
        'Back miss + move 4P left',
        'Knit + receive assistance (front and back)',
        '', '',
        'Back knit + move 1P right',
        'Back knit + move 2P right',
        'Back knit + move 3P right',
        'Back knit + move 4P right',
        'Back miss + move 1P right',
        'Back miss + move 2P right',
        'Back miss + move 4P right',
        '',
        'Links process code + Pulldown pattern output code (255)',
        'Reverse stich knit (lower) [Front-Back stich cross(2)]',
        'Front split knit',
        'Back split knit',
        'Transfer + front knit for 2nd stich (-) + transfer',
        'Back knit + transfer (non auto-transfer)',
        '',
        'Front split knit + transfer 1P left',
        'Front split knit + transfer 1P right',
        'Back split knit + transfer 1P left',
        'Back split knit + transfer 1P right',
        '',
        'Front tuck for 2nd stich (-)',
        'Back tuck for 2nd stich (-)',
        '',
        'Front knit (out of commanded bed)(without links process)',
        'Back knit (out of commanded bed) (without links process)',
        'Front miss (with links process)',
        'Back miss (with links process)',
        'Front knit (out of commanded bed) (not intended for receive assistance)',
        'Back knit (out of commanded bed) (not intended for receive assistance)',
        'Front knit (out of commanded bed) + transfer (OP line L13: back body)',
        'Color no. 1 + Auto yarn feeder point',
        'Color no. 2 + Auto yarn feeder point',
        'Color no. 3 + Auto yarn feeder point',
        'Color no. 4 + Auto yarn feeder point',
        '',
        'Front split knit + transfer 2P left',
        'Front split knit + transfer 2P right',
        'Back split knit + transfer 2P left',
        'Back split knit + transfer 2P right',
        'Back knit (out of commanded bed) + transfer (OP Lline L13: front body)',
        'Front knit (without miss TR)',
        'Back knit (without miss TR)',
        '', '',
        'Front / back move 1 pitch left',
        'Front / back move 1 pitch right',
        '', '', '', '', '', '', '', '',
        'Front / back move 2 pitch left',
        'Front / back move 2 pitch right',
        '', '', '', '', '', '', '', '', '', '', '', '', '', '',
        'Front knit (jersey) Knitting assist prohibition (without links process)',
        'Back knit (reversed jersey) Knitting assist prohibition (without links process)',
        '', '', '', '', '', '', '', '',
        'Front tuck (without links process)',
        'Back tuck (without links process)',
        'Front tuck for 2nd stich (without links process)',
        'Back tuck for 2nd stich (without links process)',
        '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '',
        '', '', '', '', '', '',
        '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '',
        '', '', '', '', '', '',
        '', '', '', '', '', '',
        'Pulldown pattern shift knit code',
        '',
        'Pulldown pattern output code',
        'Pulldown pattern output code',
        'Pulldown pattern output code',
        '',
        'Pulldown pattern output code'
    ]

    # Default resolution
    resolution_valid = 0
    resolution_x_den = 0
    resolution_x_nom = 0
    resolution_y_den = 0
    resolution_y_nom = 0

    # Default bitmap-data: all black
    bitmap_data = [0] * (490 * 406)

    """
    Represents a KnitPaint file with all its attributes
    """

    def __init__(self, input_filename=None):
        """
        Initializes an instance by either reading the file with the provided filename or using default values
        :param input_filename:
        """
        if input_filename is not None:
            self.read_dat_file(input_filename)

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

    def set_np_bitmap_data(self, bitmap_data):
        """
        Sets new bitmap data from a numpy array
        :param bitmap_data:
        :return:
        """
        new_bitmap_data = bitmap_data.flatten().tolist()
        height, width = bitmap_data.shape
        self.set_bitmap_data(new_bitmap_data, width, height)

    def read_dat_file(self, input_filename):
        """
        Reads all information from the provided dat file
        :param input_filename:
        :return:
        """
        dat_bytes = open(input_filename, "rb").read()
        self.read_dat_bytes(dat_bytes)

    def read_dat_bytes(self, dat_bytes):
        """
        Reads all information from the provided dat bytes
        :param dat_bytes:
        :return:
        """
        # Check if file needs to be decompressed
        compress_text = "SDS LZSS COMPRESS Ver 1.00"
        compress_bytes = compress_text.encode()
        if compress_bytes == dat_bytes[0:len(compress_bytes)]:
            dat_bytes = self.decompress_dat_bytes(dat_bytes)

        raise NotImplementedError('Confidential')

    def decompress_dat_bytes(self, dat_bytes):
        """
        Decompresses the bytes provided and returns the decompressed bytes
        :param dat_bytes:
        :return:
        """
        raise NotImplementedError('Confidential')

    def read_bitmap_data_with_linebreaks(self, bitmap_data, linebreak_char, target_width=None, target_height=None):
        """
        Creates new bitmap data by separating lines using the provided linebreak character
        :param bitmap_data:
        :param linebreak_char:
        :param target_width:
        :param target_height:
        :return:
        """
        # Read lines
        lines = []
        current_line = []
        width = 0
        for bitmap_element in bitmap_data:
            if bitmap_element == linebreak_char:
                if len(current_line) > width:
                    width = len(current_line)
                lines.append(current_line)
                current_line = []
            else:
                current_line.append(bitmap_element)
        if len(current_line) > 0:
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
            current_line += [0] * (width - len(current_line))
            new_bitmap_data += current_line

        # Set the new bitmap data
        self.set_bitmap_data(new_bitmap_data, width, len(lines))

    def read_image(self, image_filename):
        """
        Creates new bitmap data by finding the correct color numbers from an image
        :param image_filename:
        :return:
        """
        # Read image and bring it into the correct shape
        image_bgr_flipped = cv2.imread(image_filename, cv2.IMREAD_COLOR)
        image_bgr = cv2.flip(image_bgr_flipped, 0)
        image_rgb = image_bgr[:, :, ::-1]
        height, width, _ = image_rgb.shape
        colors = image_rgb.reshape((width*height, 3))

        # Search for matching color numbers for each color use the nearest color if the color is not in the list
        def find_nearest_color_number(color):
            nearest_index = None
            nearest_distance = None
            for index, color_table_item in enumerate(self.color_table):
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
        self.set_np_bitmap_data(bitmap_data)

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

    def get_np_bitmap_data(self):
        """
        Returns the bitmap data as a numpy matrix
        :return:
        """
        current_height = self.get_height()
        current_width = self.get_width()
        bitmap_np = np.array(self.bitmap_data).astype(int)
        bitmap_np_shaped = np.reshape(bitmap_np, (current_height, current_width))
        return bitmap_np_shaped

    def normalize_bitmap_data(self, has_option_line=True, option_line='keep'):
        """
        Crops the bitmap data by removing all the "black" around the edges. Optionally modifies the option line
        Option line can be kept, removed or replaced with the default option line

        :param has_option_line:
        Set to True if the current bitmap data contains an option line

        :param option_line:
        Set to 'keep' if no change to the option line should be made.
        Set to 'remove' to remove the existing option line.
        Set to 'default' to remove existing option lines and replace them with the default option line.

        :return:
        """

        # Convert into a numpy array for easier handling
        bitmap_np = self.get_np_bitmap_data()

        # Crop to the option line (if available) and crop the knitpaint itself
        if has_option_line:
            bitmap_np = self._normalize_np_bitmap_data(bitmap_np, 'purple')
            knitpaint = self._normalize_np_bitmap_data(bitmap_np[:, 42:-42])
        else:
            knitpaint = self._normalize_np_bitmap_data(bitmap_np)

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
        self.set_np_bitmap_data(bitmap_normalized)

    def _normalize_np_bitmap_data(self, np_bitmap_data, mode='black'):
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
        normalized = np_bitmap_data[first_colored_y:last_colored_y+1, first_colored_x:last_colored_x+1]
        return normalized

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

    def add_col(self, col, right=True):
        """
        Adds a column to the right (or left) side of the bitmap data
        :param col:
        :param right:
        :return:
        """
        np_bitmap_data = self.get_np_bitmap_data()
        height, _ = np_bitmap_data.shape
        if right:
            new_bitmap_data = np.hstack((np_bitmap_data, col))
        else:
            new_bitmap_data = np.hstack((col, np_bitmap_data))
        self.set_np_bitmap_data(new_bitmap_data)

    def add_char_col(self, char, right=True):
        """
        Adds a column with the provided character to the right (or left) side of the bitmap data
        :param char:
        :param left:
        :return:
        """
        height = self.get_height()
        char_col = (np.ones((height, 1)) * char).astype(int)
        self.add_col(char_col, right)

    def save_preview_image(self, output_filename):
        """
        Builds a preview image of the current KnitPaint file using Numpy and OpenCV
        :param output_filename:
        :return:
        """
        bitmap_width = self.get_width()
        bitmap_height = self.get_height()
        bitmap_np = np.array(self.bitmap_data)
        bitmap_np_shaped = np.reshape(bitmap_np, (bitmap_height, bitmap_width))
        bitmap_lut = np.array(self.color_table)
        image_rgb = bitmap_lut[bitmap_np_shaped]
        image_bgr = image_rgb[:, :, ::-1]
        image_bgr_flipped = cv2.flip(image_bgr, 0)
        cv2.imwrite(output_filename, image_bgr_flipped)
        print('Saved preview image to ' + output_filename)

    def save_training_data(self, output_filename):
        """
        Saves the bitmap data to a file to use for training
        :param output_filename:
        :return:
        """
        training_bytes = bytearray(self.bitmap_data)
        with open(output_filename, "w+b") as file:
            file.write(training_bytes)
            file.close()
            print('Saved training data to ' + output_filename)

    def get_dat_bytes(self):
        """
        Converts the current data to a knitpaint dat file and returns the bytes
        :return:
        """
        raise NotImplementedError('Confidential')

    def save_dat_file(self, output_filename):
        """
        Saves the current data as knitpaint dat file
        :param output_filename:
        :return:
        """
        # Get bytes
        dat_bytes = self.get_dat_bytes()

        # Write file
        with open(output_filename, "w+b") as file:
            file.write(dat_bytes)
            file.close()
            print('Saved dat to ' + output_filename)

    def find_categories_by_keyword(self, keywords):
        """
        Checks the color_labels for matches with the keywords
        :param char:
        :return: Indices of color_labels, that contain at least one of the keywords.
                 If no match is found [-1] is returned.
        """

        # Search for matches of every keyword in color_label list and append to color_label_indices
        color_label_indices = []
        for keyword in keywords:
            for label_index in range(len(self.color_labels)):

                if keyword in self.color_labels[label_index]:
                    color_label_indices.append(label_index)

        # Delete duplicates in the labels to receive a unique index listing
        color_label_indices = np.unique(color_label_indices)

        # Return -1 if no keyword match was found in the labels, else return the label indices
        if len(color_label_indices == 0):
            return [-1]
        else:
            return color_label_indices

    def bitmap_syntax_check(self, maximum_tucks: int):
        """
        Checks current bitmap data for syntactical correctness
        :param char:
        :return: True if syntax correct, False if syntax is incorrect
        """
        syntax_check = True
        bitmap_width = self.get_width()
        bitmap_height = self.get_height()
        bitmap_np = np.array(self.bitmap_data)
        bitmap_np_shaped = np.reshape(bitmap_np, (bitmap_height, bitmap_width))

        # Check1: Knit: 1: Total courses must be even number
        if not bitmap_height % 2 == 0:
            syntax_check = False
            print('Error: Current Bitmap data did not pass the syntax check: '
                  + 'Total courses number is ' + str(bitmap_height) + ' and should be an even number.')

        # Check2: Knit: 2: Always check carrier position after ending
        # ...

        # Check3: Tuck: 1: Do not tuck on the ending needle
        for line_index in range(bitmap_height):
            # Check if there is a tuck on an ending needle for each line in the bitmap data
            if (
                    bitmap_np_shaped[line_index][0] in self.find_categories_by_keyword(['tuck'])
                    or bitmap_np_shaped[line_index][self.get_width() - 1] in self.find_categories_by_keyword(['tuck'])
            ):
                syntax_check = False
                print('Error: Current Bitmap data did not pass the syntax check: '
                      + 'Tuck on ending needle in numpy bitmap line ' + str(line_index + 1) + ' detected. '
                      + 'Do not tuck on the ending needle')

        # Check4: Tuck: 2: Do not tuck more than x (depends on yarn)
        for column_index in range(bitmap_width):
            tucks_in_row = 0
            for line_index in range(bitmap_height):

                # Sum up the tucks appended continuous in a column
                if (bitmap_np_shaped[line_index][column_index] in self.find_categories_by_keyword(['tuck'])):
                    tucks_in_row += 1
                else:
                    tucks_in_row = 0

                # If number of continuous tucks exceeds the maximum number, the syntax is not correct
                if tucks_in_row > maximum_tucks:
                    syntax_check = False
                    print('Error: Current Bitmap data did not pass the syntax check: '
                          + 'Maximum number of tucks in row exceeded in numpy bitmap column ' + str(line_index + 1)
                          + ' and line ' + str(column_index + 1) + '. Do not do more tucks than ' + str(maximum_tucks)
                          + ' per column.')

        # Check5: Miss: 1: if miss >= course; Color0 = Color16; Color13 = Color16
        for line_index in range(3, bitmap_height-3):
            # Check if there is a whole line of misses in the bitmap data, that was not set to Color16
            # and the whole line of misses is not in the first or last 3 lines of the normalized Bitmap data
            if(
                (bitmap_np_shaped[line_index] == [0]*bitmap_width).all()
                or (bitmap_np_shaped[line_index] == [13]*bitmap_width).all()
            ):
                syntax_check = False
                print('Error: Current Bitmap data did not pass the syntax check: '
                      + 'Complete line of misses in line ' + str(line_index+1) + ' detected. '
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
                if (color_label in bitmap_np_shaped[line_index]):
                    cross_lower_set_1 = True

            for color_label in color_labels_cross_upper_1:
                if (color_label in bitmap_np_shaped[line_index]):
                    cross_upper_set_1 = True

            for color_label in color_labels_cross_lower_2:
                if (color_label in bitmap_np_shaped[line_index]):
                    cross_lower_set_2 = True

            for color_label in color_labels_cross_upper_2:
                if (color_label in bitmap_np_shaped[line_index]):
                    cross_upper_set_2 = True

            # If any cross stitch does not appear in a pair, the syntax is not correct
            if (cross_lower_set_1 ^ cross_upper_set_1) or (cross_lower_set_2 ^ cross_upper_set_2):
                syntax_check = False
                print('Error: Current Bitmap data did not pass the syntax check: '
                      + 'Single category of cross stitch in line ' + str(line_index + 1) + ' detected. '
                      + 'Cross stitches have to come in pairs.')
        return syntax_check
