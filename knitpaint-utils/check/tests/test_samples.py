import pandas as pd
from ... import KnitPaint
from .. import check_pattern
from ..problems import KnitpaintCheckException, KnitpaintCheckError, KnitpaintCheckSyntaxError


def test_samples():
    data_dir = '../data/raw/staf/'
    df = pd.DataFrame(pd.read_json(data_dir + 'staf-details-training.json'))
    correct = 0
    warning = 0
    error = 0
    not_implemented = 0
    for _, row in df.iterrows():
        file = data_dir + row['apex_file']
        knitpaint = KnitPaint(file)

        # Check should not throw an error
        try:
            check_pattern(knitpaint)
            correct += 1
        except KnitpaintCheckException as e:
            is_error = False
            for problem in e.problems:
                if isinstance(problem, KnitpaintCheckError) or isinstance(problem, KnitpaintCheckSyntaxError):
                    is_error = True
            if is_error:
                error += 1
            else:
                warning += 1
        except NotImplementedError as e:
            not_implemented += 1
    print('Correct: ' + str(correct) + ', Warning: ' + str(warning) + ', Error: ' + str(error),
          ', Not implemented: ' + str(not_implemented))

