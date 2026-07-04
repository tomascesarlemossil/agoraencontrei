"""Test bootstrap for the image-processor package.

Adds the service root (parent of `tests/`) to sys.path so `import logos`
works when pytest is invoked from anywhere.
"""
import os
import sys

SERVICE_ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if SERVICE_ROOT not in sys.path:
    sys.path.insert(0, SERVICE_ROOT)
