import os
import sys
import subprocess
from pathlib import Path

is_dev = len(sys.argv) > 1 and sys.argv[1] in ("dev", "development", "D")

if is_dev:
    print("Preparing development environment...")
else:
    print("Preparing environment...")

# Install requirements

requirements_path = Path(os.path.join(os.path.dirname(__file__), "requirements.txt")).resolve()

print("Installing requirements...")

subprocess.run(["pip", "install", "-r", str(requirements_path)], check=True)

print("Requirements installed successfully.")

if is_dev:
    # Install dev requirements
    dev_requirements_path = Path(os.path.join(os.path.dirname(__file__), "requirements-dev.txt")).resolve()

    print("Installing development requirements...")

    subprocess.run(["pip", "install", "-r", str(dev_requirements_path)], check=True)

    print("Development requirements installed successfully.")
