import os
import sys

# Add backend directory to Python system path
current_dir = os.path.dirname(os.path.abspath(__file__))
root_dir = os.path.abspath(os.path.join(current_dir, ".."))
backend_dir = os.path.join(root_dir, "backend")

sys.path.insert(0, root_dir)
sys.path.insert(0, backend_dir)

from backend.app.main import app
