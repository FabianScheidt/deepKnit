# Define beds
NO_BED = None
FRONT = 0
BACK = 1
FRONT_BACK = 2
BEDS = [FRONT, BACK]

# Define transfers
NO_TRANSFER = None
FRONT_TO_BACK = 0
BACK_TO_FRONT = 1

# Define operations
MISS = None
KNIT = 0
TUCK = 1
SPLIT = 2


# Define class as a structure for all color numbers
class ColorNumber:
    def __init__(self, bed=NO_BED, operation=MISS,
                 transfer_before_racking=NO_TRANSFER, racking: int = 0,
                 transfer_while_racking=NO_TRANSFER, transfer_after_racking=NO_TRANSFER,
                 links_process=False):
        # Do some basic value checking
        if bed not in [NO_BED, FRONT, BACK, FRONT_BACK]:
            raise ValueError("Unknown bed")
        if operation not in [MISS, KNIT, TUCK, SPLIT]:
            raise ValueError("Unknown operation")
        if transfer_before_racking not in [NO_TRANSFER, FRONT_TO_BACK, BACK_TO_FRONT]:
            raise ValueError("Unknown transfer before racking")
        if racking < -7 or racking > 7:
            raise ValueError("Racking is too big")
        if racking == 0 and transfer_while_racking is not NO_TRANSFER:
            raise ValueError("Transfer while racking will not be performed if racking is 0")
        if transfer_while_racking not in [NO_TRANSFER, FRONT_TO_BACK, BACK_TO_FRONT]:
            raise ValueError("Unknown transfer while racking")
        if transfer_after_racking not in [NO_TRANSFER, FRONT_TO_BACK, BACK_TO_FRONT]:
            raise ValueError("Unknown transfer after racking")

        # Set values
        self.bed = bed
        self.operation = operation
        self.transfer_before_racking = transfer_before_racking
        self.racking = racking
        self.transfer_while_racking = transfer_while_racking
        self.transfer_after_racking = transfer_after_racking
        self.links_process = links_process


# Define color numbers
COLOR_NUMBERS: [ColorNumber] = list([None] * 256)
COLOR_NUMBERS[0] = ColorNumber(NO_BED, MISS)
COLOR_NUMBERS[1] = ColorNumber(FRONT, KNIT, links_process=True)
COLOR_NUMBERS[2] = ColorNumber(BACK, KNIT, links_process=True)
COLOR_NUMBERS[6] = ColorNumber(FRONT, KNIT, FRONT_TO_BACK, -1, BACK_TO_FRONT, links_process=True)
COLOR_NUMBERS[7] = ColorNumber(FRONT, KNIT, FRONT_TO_BACK, 1, BACK_TO_FRONT, links_process=True)
COLOR_NUMBERS[8] = ColorNumber(BACK, KNIT, FRONT_TO_BACK, -1, BACK_TO_FRONT, FRONT_TO_BACK, links_process=True)
COLOR_NUMBERS[9] = ColorNumber(BACK, KNIT, FRONT_TO_BACK, 1, BACK_TO_FRONT, FRONT_TO_BACK, links_process=True)
COLOR_NUMBERS[11] = ColorNumber(FRONT, TUCK, links_process=True)
COLOR_NUMBERS[12] = ColorNumber(BACK, TUCK, links_process=True)
COLOR_NUMBERS[16] = ColorNumber(NO_BED, MISS)
COLOR_NUMBERS[20] = ColorNumber(FRONT, KNIT, FRONT_TO_BACK)
COLOR_NUMBERS[21] = ColorNumber(FRONT, KNIT, NO_TRANSFER, 1, FRONT_TO_BACK, BACK_TO_FRONT)
COLOR_NUMBERS[22] = ColorNumber(FRONT, KNIT, NO_TRANSFER, 2, FRONT_TO_BACK, BACK_TO_FRONT)
COLOR_NUMBERS[23] = ColorNumber(FRONT, KNIT, NO_TRANSFER, 3, FRONT_TO_BACK, BACK_TO_FRONT)
COLOR_NUMBERS[24] = ColorNumber(FRONT, KNIT, NO_TRANSFER, -1, FRONT_TO_BACK, BACK_TO_FRONT)
COLOR_NUMBERS[25] = ColorNumber(FRONT, KNIT, NO_TRANSFER, -2, FRONT_TO_BACK, BACK_TO_FRONT)
COLOR_NUMBERS[26] = ColorNumber(FRONT, KNIT, NO_TRANSFER, -3, FRONT_TO_BACK, BACK_TO_FRONT)
COLOR_NUMBERS[29] = ColorNumber(FRONT, KNIT, BACK_TO_FRONT)
COLOR_NUMBERS[40] = ColorNumber(FRONT, KNIT, FRONT_TO_BACK, 0, NO_TRANSFER, BACK_TO_FRONT)
COLOR_NUMBERS[50] = ColorNumber(BACK, KNIT, BACK_TO_FRONT, 0, NO_TRANSFER, FRONT_TO_BACK)
COLOR_NUMBERS[51] = ColorNumber(FRONT, KNIT)
COLOR_NUMBERS[52] = ColorNumber(BACK, KNIT)
COLOR_NUMBERS[61] = COLOR_NUMBERS[6]
COLOR_NUMBERS[62] = ColorNumber(FRONT, KNIT, FRONT_TO_BACK, -2, BACK_TO_FRONT, links_process=True)
COLOR_NUMBERS[63] = ColorNumber(FRONT, KNIT, FRONT_TO_BACK, -3, BACK_TO_FRONT, links_process=True)
COLOR_NUMBERS[64] = ColorNumber(FRONT, KNIT, FRONT_TO_BACK, -4, BACK_TO_FRONT, links_process=True)
COLOR_NUMBERS[65] = ColorNumber(FRONT, MISS, FRONT_TO_BACK, -1, BACK_TO_FRONT, links_process=True)
COLOR_NUMBERS[66] = ColorNumber(FRONT, MISS, FRONT_TO_BACK, -2, BACK_TO_FRONT, links_process=True)
COLOR_NUMBERS[67] = ColorNumber(FRONT, MISS, FRONT_TO_BACK, -4, BACK_TO_FRONT, links_process=True)
COLOR_NUMBERS[71] = COLOR_NUMBERS[7]
COLOR_NUMBERS[72] = ColorNumber(FRONT, KNIT, FRONT_TO_BACK, 2, BACK_TO_FRONT, links_process=True)
COLOR_NUMBERS[73] = ColorNumber(FRONT, KNIT, FRONT_TO_BACK, 3, BACK_TO_FRONT, links_process=True)
COLOR_NUMBERS[74] = ColorNumber(FRONT, KNIT, FRONT_TO_BACK, 4, BACK_TO_FRONT, links_process=True)
COLOR_NUMBERS[75] = ColorNumber(FRONT, MISS, FRONT_TO_BACK, 1, BACK_TO_FRONT, links_process=True)
COLOR_NUMBERS[76] = ColorNumber(FRONT, MISS, FRONT_TO_BACK, 2, BACK_TO_FRONT, links_process=True)
COLOR_NUMBERS[77] = ColorNumber(FRONT, MISS, FRONT_TO_BACK, 4, BACK_TO_FRONT, links_process=True)
COLOR_NUMBERS[81] = COLOR_NUMBERS[8]
COLOR_NUMBERS[82] = ColorNumber(BACK, KNIT, FRONT_TO_BACK, -2, BACK_TO_FRONT, FRONT_TO_BACK, links_process=True)
COLOR_NUMBERS[83] = ColorNumber(BACK, KNIT, FRONT_TO_BACK, -3, BACK_TO_FRONT, FRONT_TO_BACK, links_process=True)
COLOR_NUMBERS[84] = ColorNumber(BACK, KNIT, FRONT_TO_BACK, -4, BACK_TO_FRONT, FRONT_TO_BACK, links_process=True)
COLOR_NUMBERS[85] = ColorNumber(BACK, MISS, FRONT_TO_BACK, -1, BACK_TO_FRONT, FRONT_TO_BACK, links_process=True)
COLOR_NUMBERS[86] = ColorNumber(BACK, MISS, FRONT_TO_BACK, -2, BACK_TO_FRONT, FRONT_TO_BACK, links_process=True)
COLOR_NUMBERS[87] = ColorNumber(BACK, MISS, FRONT_TO_BACK, -4, BACK_TO_FRONT, FRONT_TO_BACK, links_process=True)
COLOR_NUMBERS[91] = COLOR_NUMBERS[9]
COLOR_NUMBERS[92] = ColorNumber(BACK, KNIT, FRONT_TO_BACK, 2, BACK_TO_FRONT, FRONT_TO_BACK, links_process=True)
COLOR_NUMBERS[93] = ColorNumber(BACK, KNIT, FRONT_TO_BACK, 3, BACK_TO_FRONT, FRONT_TO_BACK, links_process=True)
COLOR_NUMBERS[94] = ColorNumber(BACK, KNIT, FRONT_TO_BACK, 4, BACK_TO_FRONT, FRONT_TO_BACK, links_process=True)
COLOR_NUMBERS[95] = ColorNumber(BACK, KNIT, FRONT_TO_BACK, 1, BACK_TO_FRONT, FRONT_TO_BACK, links_process=True)
COLOR_NUMBERS[96] = ColorNumber(BACK, KNIT, FRONT_TO_BACK, 2, BACK_TO_FRONT, FRONT_TO_BACK, links_process=True)
COLOR_NUMBERS[97] = ColorNumber(BACK, KNIT, FRONT_TO_BACK, 4, BACK_TO_FRONT, FRONT_TO_BACK, links_process=True)
COLOR_NUMBERS[116] = ColorNumber(BACK, MISS, links_process=True)
COLOR_NUMBERS[117] = ColorNumber(FRONT, MISS, links_process=True)
