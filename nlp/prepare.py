import os
import sys
import subprocess
from pathlib import Path

LOG_PREFIX = "[prepare]"

is_dev = len(sys.argv) > 1 and sys.argv[1] in ("dev", "development", "D")

if is_dev:
    print(f"{LOG_PREFIX} Preparing development environment...")
else:
    print(f"{LOG_PREFIX} Preparing environment...")

# Install requirements

requirements_path = Path(os.path.join(os.path.dirname(__file__), "requirements.txt")).resolve()

print(f"{LOG_PREFIX} Installing requirements...")

subprocess.run(["pip", "install", "-r", str(requirements_path)], check=True)

print(f"{LOG_PREFIX} Requirements installed successfully.")

if is_dev:
    # Install dev requirements
    dev_requirements_path = Path(os.path.join(os.path.dirname(__file__), "requirements-dev.txt")).resolve()

    print(f"{LOG_PREFIX} Installing development requirements...")

    subprocess.run(["pip", "install", "-r", str(dev_requirements_path)], check=True)

    print(f"{LOG_PREFIX} Development requirements installed successfully.")

# Download NLTK data

from env import nltk_data_path
import nltk

print(f"{LOG_PREFIX} Downloading NLTK data...")

nltk.download("punkt_tab", download_dir=nltk_data_path)

print(f"{LOG_PREFIX} NLTK data downloaded successfully.")
