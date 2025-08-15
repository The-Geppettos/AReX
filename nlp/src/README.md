# Agentic AI Augmented Reading eXperience (AReX)

An intelligent eBook reading application that uses AI to enhance the reading experience. The application helps users understand and engage with books better through AI-powered assistance.

## Features

- Modern, responsive UI for reading books
- AI-powered assistance panel for explanations and insights
- Progress tracking and checkpoints
- User level-based content adaptation
- Interactive quizzes and summaries
- Interactive Streamlit Application for NLP pipeline visualization and testing

## Source Code Structure

```
.
├── frontend/          # React frontend application
├── backend/           # Node.js/Express backend server
├── nlp/               # Python NLP module for text processing
└── shared/            # Shared TypeScript types
```

## Architecture Components

The application is built using a microservices architecture with the following components:
- **Frontend**: A React application that provides the user interface for eBook service and management.
- **Backend**: A Node.js/Express server that handles API requests. This server is aimed to work like a gateway which handles I/O operations along with simple validations only.
- **MainDB(PostgreSQL)**: A relational database for storing main content data such as books, user profiles, and reading progress.
- **VectorDB(ChromaDB)**: A vector database for storing and retrieving book text embeddings for real-time AI-powered features.
- **MessageBroker(RabbitMQ)**: A message broker for handling asynchronous tasks, mainly for heavy processing tasks like NLP operations.
- **NLP Module**: A Python-based module that processes heavy NLP tasks, including a pre-processing pipeline for text chunking, embedding generation, and language-specific analysis (English and Korean). It communicates with the backend via RabbitMQ.

## Setup for Development

### Prerequisites

- Docker
- OpenAI API key

### Set environment variables

copy `.env.example` to `.env` and fill in the required values.

### Start the application

Start development service using Docker Compose:

```bash
docker-compose up
```

### Run the Streamlit Application

To run the Streamlit application for NLP pipeline visualization and testing:

```bash
cd nlp/src
streamlit run streamlit_app.py
```
