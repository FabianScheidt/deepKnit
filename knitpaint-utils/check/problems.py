# Define thresholds for checking
MAX_CABLE_THRESH = 3
MAX_NUMBER_OF_LOOPS_IN_NEEDLE_WARN_THRESH = 3
MAX_NUMBER_OF_LOOPS_IN_NEEDLE_ERR_THRESH = 4
MAX_RACKING_WARN_THRESH = 5
MAX_RACKING_ERR_THRESH = 6
MAX_LOOP_HOLD_WARN_THRESH = 8
MAX_LOOP_HOLD_ERR_THRESH = 8


class KnitPaintCheckException(Exception):
    """
    Exceptions is thrown when warnings or errors occur during the check. The list of problems contains all warnings and
    errors that occurred.
    """
    def __init__(self, problems, loops=None):
        self.problems = problems
        self.loops = loops if loops is not None else []


class KnitPaintCheckProblem:
    """
    Superclass for problems that can occur referencing the location of the problem
    """
    def __init__(self, course, wale):
        self.course = course
        self.wale = wale


class KnitPaintCheckSyntaxError(KnitPaintCheckProblem):
    """
    Superclass for all errors that affect the syntax of the knitpaint. These problems can not be ignored. The knitpaint
    will not be processable.
    """
    pass


class KnitPaintCheckWarning(KnitPaintCheckProblem):
    """
    Superclass for all warnings that can occur during the check. The machine can process the knitpaint despite these
    warnings so they might be ignored.
    """
    pass


class KnitPaintCheckError(KnitPaintCheckProblem):
    """
    Superclass for all errors that can occur during the check. The machine can process the knitpaint despite these
    errors so they might be ignored. Errors are more serious to cause damages compared to warnings.
    """
    pass


class IncompleteCableError(KnitPaintCheckSyntaxError):
    """
    This error occurs when a cable stitch does not pair with another one
    """
    pass


class OversizedCableError(KnitPaintCheckSyntaxError):
    """
    This error occurs when a cable stitch is too long
    """
    pass


class NumberOfLoopsInNeedleWarning(KnitPaintCheckWarning):
    """
    This warning occurs when too many loops are held in a needle. It can occur by tucking to many times or transferring
    too many loops onto a needle
    """
    pass


class NumberOfLoopsInNeedleError(KnitPaintCheckError):
    """
    This error occurs when too many loops are held in a needle. It can occur by tucking to many times or transferring
    too many loops onto a needle
    """
    pass


class RackingWarning(KnitPaintCheckWarning):
    """
    This warning occurs for too much racking caused by big move or cable stitches
    """
    pass


class RackingError(KnitPaintCheckError):
    """
    This error occurs for too much racking caused by big move or cable stitches
    """
    pass


class LoopHoldWarning(KnitPaintCheckWarning):
    """
    This warning occurs when too many loops are held in a needle. This can be caused by tucking or transfer stitches.
    """
    pass


class LoopHoldError(KnitPaintCheckError):
    """
    This error occurs when too many loops are held in a needle. This can be caused by tucking or transfer stitches.
    """
    pass


class ContinuousPickupStitchWarning(KnitPaintCheckWarning):
    """
    This error occurs when stitches that pick up a new yarn drop it at the same time
    """
    pass


class TransferOutOfBedError(KnitPaintCheckError):
    """
    This error occurs when a stitch is transferred to a needle that does not exist because it is too far on either the
    left or the right edge of the bed.
    """
    pass
