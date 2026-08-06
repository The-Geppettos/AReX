# AReX (Agentic AI Augmented Reading eXperience)

AReX is an intelligent eBook reading platform that uses AI to enhance reading comprehension and engagement.

---

## Monorepo Architecture Overview

AReX is structured as a monorepo microservice architecture containerized with Docker Compose:

```
                     +---------------------+
                     |  Frontend (React)   |
                     | Ports 13000 / 3000  |
                     +----------+----------+
                                | REST / API Proxy
                                v
                     +---------------------+
                     | Core Server (Node)  |
                     | Ports 13001 / 3001  |
                     +----+-------+------+-+
                          |       |      |
             +------------+       |      +------------+
             |                    |                   |
             v                    v                   v
    +-----------------+  +-----------------+  +---------------+
    | CoreDB (Postgres|  | VectorDB(Chroma)|  | MessageBroker |
    |   Port 5432     |  |   Port 8000     |  |   (RabbitMQ)  |
    +-----------------+  +-----------------+  +-------+-------+
                                                      | Queues
                                                      v
                                              +---------------+
                                              | NLP Worker    |
                                              | (Python 3.12) |
                                              +---------------+
```

---

## Component Documentation

For detailed information regarding architecture, coding conventions, testing, and component-specific commands, refer to the documentation in each module:

- 🖥️ **[Frontend Documentation](file:///home/juhonam/workspace/AReX/frontend/AGENTS.md)** (`/frontend`): React 19, TypeScript, Vite, MUI, and SCSS reader interface.
- ⚙️ **[Core Server Documentation](file:///home/juhonam/workspace/AReX/core-server/AGENTS.md)** (`/core-server`): Node.js, Express, TypeScript API orchestrator & DI container.
- 🧠 **[NLP Worker Documentation](file:///home/juhonam/workspace/AReX/nlp/AGENTS.md)** (`/nlp`): Python 3.12 asynchronous text analyzer and RabbitMQ consumer.
- 📦 **[Shared Module Documentation](file:///home/juhonam/workspace/AReX/shared/AGENTS.md)** (`/shared`): Shared TypeScript data models, API interfaces, and queue contracts.

---

## Environment Setup & Monorepo Commands

### Environment Configuration
1. Copy [.env.sample](file:///home/juhonam/workspace/AReX/.env.sample) to `.env`:
   ```bash
   cp .env.sample .env
   ```
2. Configure `OPENAI_API_KEY` and port bindings in `.env`.

### Monorepo Commands (Docker Compose)
- **Start full development stack**:
  ```bash
  docker compose up
  ```
- **Rebuild and start stack**:
  ```bash
  docker compose up --build
  ```
- **Stop all services**:
  ```bash
  docker compose down
  ```
- **Backend Health Check**:
  ```bash
  curl http://localhost:13001/health
  ```
