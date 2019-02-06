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
LINKS = 2

# Define operations
MISS = None
KNIT = 0
TUCK = 1
SPLIT = 2


# Define class as a structure for all color numbers
class ColorNumber:
    def __init__(self, transfer_before_operation, bed, operation,
                 transfer_before_racking=NO_TRANSFER, racking: int = 0,
                 transfer_while_racking=NO_TRANSFER, transfer_after_racking=NO_TRANSFER):
        # Do some basic value checking
        if transfer_before_operation not in [NO_TRANSFER, FRONT_TO_BACK, BACK_TO_FRONT, LINKS]:
            raise ValueError("Unknown transfer before operation")
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
        self.transfer_before_operation = transfer_before_operation
        self.operation = operation
        self.transfer_before_racking = transfer_before_racking
        self.racking = racking
        self.transfer_while_racking = transfer_while_racking
        self.transfer_after_racking = transfer_after_racking


# Define color numbers
COLOR_NUMBERS: [ColorNumber] = list([None] * 256)
COLOR_NUMBERS[0] = ColorNumber(NO_TRANSFER, NO_BED, MISS)
COLOR_NUMBERS[1] = ColorNumber(LINKS, FRONT, KNIT)
COLOR_NUMBERS[2] = ColorNumber(LINKS, BACK, KNIT)
COLOR_NUMBERS[6] = ColorNumber(LINKS, FRONT, KNIT, FRONT_TO_BACK, -1, BACK_TO_FRONT)
COLOR_NUMBERS[7] = ColorNumber(LINKS, FRONT, KNIT, FRONT_TO_BACK, 1, BACK_TO_FRONT)
COLOR_NUMBERS[8] = ColorNumber(LINKS, BACK, KNIT, NO_TRANSFER, -1, BACK_TO_FRONT, FRONT_TO_BACK)
COLOR_NUMBERS[9] = ColorNumber(LINKS, BACK, KNIT, NO_TRANSFER, 1, BACK_TO_FRONT, FRONT_TO_BACK)
COLOR_NUMBERS[11] = ColorNumber(LINKS, FRONT, TUCK)
COLOR_NUMBERS[12] = ColorNumber(LINKS, BACK, TUCK)
COLOR_NUMBERS[16] = ColorNumber(NO_TRANSFER, NO_BED, MISS)
COLOR_NUMBERS[40] = ColorNumber(NO_TRANSFER, FRONT, KNIT, FRONT_TO_BACK, 0, NO_TRANSFER, BACK_TO_FRONT)
COLOR_NUMBERS[50] = ColorNumber(NO_TRANSFER, BACK, KNIT, BACK_TO_FRONT, 0, NO_TRANSFER, FRONT_TO_BACK)
COLOR_NUMBERS[51] = ColorNumber(NO_TRANSFER, FRONT, KNIT)
COLOR_NUMBERS[52] = ColorNumber(NO_TRANSFER, BACK, KNIT)
COLOR_NUMBERS[61] = COLOR_NUMBERS[6]
COLOR_NUMBERS[62] = ColorNumber(LINKS, FRONT, KNIT, FRONT_TO_BACK, -2, BACK_TO_FRONT)
COLOR_NUMBERS[63] = ColorNumber(LINKS, FRONT, KNIT, FRONT_TO_BACK, -3, BACK_TO_FRONT)
COLOR_NUMBERS[64] = ColorNumber(LINKS, FRONT, KNIT, FRONT_TO_BACK, -4, BACK_TO_FRONT)
COLOR_NUMBERS[71] = COLOR_NUMBERS[7]
COLOR_NUMBERS[72] = ColorNumber(LINKS, FRONT, KNIT, FRONT_TO_BACK, 2, BACK_TO_FRONT)
COLOR_NUMBERS[73] = ColorNumber(LINKS, FRONT, KNIT, FRONT_TO_BACK, 3, BACK_TO_FRONT)
COLOR_NUMBERS[74] = ColorNumber(LINKS, FRONT, KNIT, FRONT_TO_BACK, 4, BACK_TO_FRONT)
COLOR_NUMBERS[81] = COLOR_NUMBERS[8]
COLOR_NUMBERS[82] = ColorNumber(LINKS, BACK, KNIT, NO_TRANSFER, -2, BACK_TO_FRONT, FRONT_TO_BACK)
COLOR_NUMBERS[83] = ColorNumber(LINKS, BACK, KNIT, NO_TRANSFER, -3, BACK_TO_FRONT, FRONT_TO_BACK)
COLOR_NUMBERS[84] = ColorNumber(LINKS, BACK, KNIT, NO_TRANSFER, -4, BACK_TO_FRONT, FRONT_TO_BACK)
COLOR_NUMBERS[91] = COLOR_NUMBERS[9]
COLOR_NUMBERS[92] = ColorNumber(LINKS, BACK, KNIT, NO_TRANSFER, 2, BACK_TO_FRONT, FRONT_TO_BACK)
COLOR_NUMBERS[93] = ColorNumber(LINKS, BACK, KNIT, NO_TRANSFER, 3, BACK_TO_FRONT, FRONT_TO_BACK)
COLOR_NUMBERS[94] = ColorNumber(LINKS, BACK, KNIT, NO_TRANSFER, 4, BACK_TO_FRONT, FRONT_TO_BACK)
COLOR_NUMBERS[116] = ColorNumber(LINKS, BACK, MISS)
COLOR_NUMBERS[117] = ColorNumber(LINKS, FRONT, MISS)
