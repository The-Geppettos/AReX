# NLP Worker (`/nlp`)

The **NLP Worker** is an asynchronous background processing service for heavy natural language processing tasks in AReX.

---

## Architecture & Design

Built with **Python 3.12**, the NLP module connects to RabbitMQ via `pika` to consume page pre-processing requests and publish structured analysis results back to the Core Server.

### Core Capabilities
- **Sentence Boundary Detection**: Uses **NLTK** (English) and **KSS** (Korean Sentence Splitter) to split raw page text into precise sentence ranges (`sentence_boundaries`).
- **Character Extraction**: Uses **OpenAI** / **LangChain** and morphological analyzers (**Pecab**) to identify fictional character mentions on each page.
- **Color Coding**: Computes visual color codes for text formatting based on character sentiment and presence.

---

## Directory Structure

```
nlp/
├── prepare.py          # Setup script to download NLTK data & corpora
├── dev.py              # Hot-reloading watcher using watchdog
├── env.py              # Environment configuration loader
├── requirements.txt    # Production & framework dependencies
├── src/
│   ├── main.py         # Main RabbitMQ consumer loop & queue setup
│   ├── openai.py       # OpenAI client configuration
│   └── analyzer/
│       ├── abstract.py # Base class for language analyzers
│       ├── english.py  # English text analyzer implementation
│       └── korean.py   # Korean text analyzer implementation
```

---

## Coding Conventions

- **Python Version**: Python 3.12.
- **Code Style**: Follow PEP 8 guidelines. Use clear variable names and explicit type annotations.
- **Analyzer Pattern**: Extend language analyzers by inheriting from [abstract.py](file:///home/juhonam/workspace/AReX/nlp/src/analyzer/abstract.py).
- **Queue Fault Tolerance**:
  - Implement graceful signal handlers (`SIGINT`, `SIGTERM`).
  - Always acknowledge RabbitMQ messages (`basic_ack`) upon processing.
  - Wrap processing callbacks in `try/except` blocks to prevent uncaught worker crashes.

---

## Testing & Verification Instructions

### Environment Preparation
Before running analysis or tests, ensure NLTK datasets and dependencies are prepared:
```bash
cd nlp
python -m prepare dev
```

### Unit & Integration Testing
```bash
cd nlp
pytest
```

---

## Important Files

- [src/main.py](file:///home/juhonam/workspace/AReX/nlp/src/main.py): Main RabbitMQ queue consumer and publisher loop.
- [src/analyzer/abstract.py](file:///home/juhonam/workspace/AReX/nlp/src/analyzer/abstract.py): Abstract base class defining language analyzer interfaces.
- [prepare.py](file:///home/juhonam/workspace/AReX/nlp/prepare.py): Preparation script for downloading required NLTK data.
- [dev.py](file:///home/juhonam/workspace/AReX/nlp/dev.py): Hot-reloading development script watching python files in `src/`.

---

## Common Commands

```bash
# Prepare environment and download NLTK datasets
python -m prepare dev

# Run hot-reloading dev worker
python dev.py

# Run worker directly
python -m src.main

# Run test suite
pytest
```
