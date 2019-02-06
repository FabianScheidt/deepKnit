# Define thresholds for checking
MAX_CABLE_THRESH = 3
MAX_NUMBER_OF_LOOPS_IN_NEEDLE_WARN_THRESH = 3
MAX_NUMBER_OF_LOOPS_IN_NEEDLE_ERR_THRESH = 4
MAX_RACKING_WARN_THRESH = 5
MAX_RACKING_ERR_THRESH = 6
MAX_LOOP_HOLD_WARN_THRESH = 8
MAX_LOOP_HOLD_ERR_THRESH = 8


class KnitpaintCheckException(Exception):
    """
    Exceptions is thrown when warnings or errors occur during the check. The list of problems contains all warnings and
    errors that occurred.
    """
    def __init__(self, problems):
        self.problems = problems


class KnitpaintCheckProblem:
    """
    Superclass for problems that can occur referencing the location of the problem
    """
    def __init__(self, course, needle):
        self.course = course
        self.needle = needle


class KnitpaintCheckSyntaxError(KnitpaintCheckProblem):
    """
    Superclass for all errors that affect the syntax of the knitpaint. These problems can not be ignored. The knitpaint
    will not be processable.
    """
    pass


class KnitpaintCheckWarning(KnitpaintCheckProblem):
    """
    Superclass for all warnings that can occur during the check. The machine can process the knitpaint despite these
    warnings so they might be ignored.
    """
    pass


class KnitpaintCheckError(KnitpaintCheckProblem):
    """
    Superclass for all errors that can occur during the check. The machine can process the knitpaint despite these
    errors so they might be ignored. Errors are more serious to cause damages compared to warnings.
    """
    pass


class IncompleteCableError(KnitpaintCheckSyntaxError):
    """
    This error occurs when a cable stitch does not pair with another one
    """
    pass


class OversizedCableError(KnitpaintCheckSyntaxError):
    """
    This error occurs when a cable stitch is too long
    """
    pass


class NumberOfLoopsInNeedleWarning(KnitpaintCheckWarning):
    """
    This warning occurs when too many loops are held in a needle. It can occur by tucking to many times or transferring
    too many loops onto a needle
    """
    pass


class NumberOfLoopsInNeedleError(KnitpaintCheckWarning):
    """
    This error occurs when too many loops are held in a needle. It can occur by tucking to many times or transferring
    too many loops onto a needle
    """
    pass


class RackingWarning(KnitpaintCheckWarning):
    """
    This warning occurs for too much racking caused by big move or cable stitches
    """
    pass


class RackingError(KnitpaintCheckError):
    """
    This error occurs for too much racking caused by big move or cable stitches
    """
    pass


class LoopHoldWarning(KnitpaintCheckWarning):
    """
    """
    pass


class LoopHoldError(KnitpaintCheckError):
    """
    """
    pass


class ContinuousPickupStitchWarning(KnitpaintCheckError):
    """
    """
    pass
