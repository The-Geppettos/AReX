# Agentic AI Augmented Reading eXperience (AReX)

An intelligent eBook reading application that uses AI to enhance the reading experience. The application helps users understand and engage with books better through AI-powered assistance.

## Features

- Modern, responsive UI for reading and managing books
- AI-powered chatbot
  - Assistant Mode: Provides real-time assistance while reading
  - Character Mode: Chat with fictional characters from books

## Source Code Structure

```
.
├── frontend/          # React frontend application
├── core-server/       # Node.js/Express server
├── nlp/               # Python NLP module for text processing
└── shared/            # Shared TypeScript types
```

## Architecture Components

The application is built using a microservices architecture with the following components:

- **Frontend**: A React application that provides the user interface for eBook service and management.
- **Core Server**: A Node.js/Express server that handles major business logic. It takes direct requests from the frontend and interacts with other components.
- **CoreDB(PostgreSQL)**: A relational database for storing core content data such as books, user profiles, and reading progress.
- **VectorDB(ChromaDB)**: Stores and retrieves book text embeddings for real-time AI-powered features.
- **MessageBroker(RabbitMQ)**: handles and distributes asynchronous tasks, mainly for heavy processing tasks like NLP operations.
- **NLP Module**: A Python-based module that processes heavy NLP tasks which cannot be done in real-time. It communicates with the Core Server via MessageBroker.

## Development Environment

This repository is a monorepo with Docker containerization. It provides a zero-configuration development environment that allows developers to run the entire application stack with just one command, `docker-compose up`.

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
