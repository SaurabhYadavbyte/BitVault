import sys
import os

# Add the backend directory to the sys.path
path = os.path.dirname(os.path.abspath(__file__))
if path not in sys.path:
    sys.path.insert(0, path)

# Import the Flask app
from app import app as application
