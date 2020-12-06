# KnitPaint Utilities
Utilities for handling KnitPaint files in Python

## Creating KnitPaint objects

KnitPaint objects can be created from numpy arrays, by reading the proprietary dat and lep fileformat,
or by reading an image file:

```python
import numpy as np
from knitpaint import KnitPaint

# Read using numpy
some_array = np.array([[1, 2], [2, 1])
knitpaint_1 = KnitPaint(some_array);

# Read from proprietary file formats
knitpaint_2 = KnitPaint('example.dat')
knitpaint_3 = KnitPaint('example.lep')

# Read from images
knitpaint_4 = KnitPaint('example.png')
knitpaint_5 = KnitPaint('example.jpg')
```

## Exporting KnitPaint objects

KnitPaint objects can be converted to various formats

```python
import numpy as np
from knitpaint import KnitPaint

# Read using numpy
some_array = np.array([[1, 2], [2, 1])
some_knitpaint = KnitPaint(some_array);

# Convert to numpy
numpy_data = some_knitpaint.get_np_bitmap_data()

# Write as dat
some_knitpaint.write_dat('export.dat')

# Write as image
some_knitpaint.write_image('export.png')
some_knitpaint.write_image('export.jpg')
```

## Checking a pattern

The check module virtually knits some KnitPaint and finds syntax errors, knit warnings and knit errors.
It returns a list of virtual loops if the code has no problems and throws a `KnitPaintCheckException`
with more details if it is problematic.

There are two methods for checking: `check` checks the code as if it was directly adjecent to an option
line. `check_as_pattern` checks it as if it was a pattern, that is repeated multiple times and embedded
into some front knitted single jersey.

```python
import numpy as np
from knitpaint import KnitPaint

# Read using numpy
some_array = np.array([[1, 2], [2, 1])
some_knitpaint = KnitPaint(some_array);

# Perform checks
loops_1 = some_knitpaint.check()
loops_2 = some_knitpaint.check_as_pattern()
```

## Other functionality

There are various methods to read, write and modify KnitPaint objects. Please see the [code](__init__.py)
for more details.
