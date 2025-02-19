#!/usr/bin/env python
import os
import sys

if __name__ == '__main__':
    # Set to "Myproject.settings" based on your file path
    os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'myproject.settings')
    try:
        from django.core.management import execute_from_command_line
    except ImportError as exc:
        raise ImportError(
            "Couldn't import Django. Make sure it's installed and available on your PYTHONPATH. "
            "Did you forget to activate your virtual environment?"
        ) from exc
    execute_from_command_line(sys.argv)
