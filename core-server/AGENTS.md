# Core Server (`/core-server`)

The **Core Server** is the primary API gateway, database orchestrator, and AI service integration layer for AReX.

---

## Architecture & Design

Built with **Node.js**, **Express**, and **TypeScript**, the core server acts as the central hub connecting the frontend, PostgreSQL, ChromaDB, RabbitMQ, and OpenAI APIs.

### Key Architectural Patterns
- **Dependency Injection Container**: All components, controllers, services, database tables, and queues are wired in [container.ts](file:///home/juhonam/workspace/AReX/core-server/src/container.ts).
- **Layered Design**:
  - `component/`: Abstractions for infrastructure (PostgreSQL `CoreDB`, ChromaDB `VectorDB`, RabbitMQ `MessageBroker`, HTTP server).
  - `services/`: Business logic layer (book ingestion, page processing, AI agents).
  - `controllers/`: Express HTTP routing layer translating API requests to service calls.
- **Admin Scoping (`NO_ADMIN`)**:
  Supports running in restricted read-only reader mode (`NO_ADMIN=true`). In this mode, upload controllers, book management routes, and RabbitMQ message consumers are omitted.

---

## Directory Structure

```
core-server/
├── dev.js              # Hot-reloading development runner (chokidar watcher)
├── clean.js            # Build cleanup utility script
├── start.js            # Entry point for production execution
├── package.json        # Dependencies & npm scripts
├── tsconfig.json       # TypeScript configuration & path aliases
└── src/
    ├── container.ts    # Central Dependency Injection initialization
    ├── index.ts        # Express app bootstrapper and signal handler
    ├── util.ts         # Utility helpers
    ├── component/      # DB, Vector DB, RabbitMQ, HTTP abstractions
    ├── controllers/    # API Controllers (books, pages, agents, upload, manage)
    └── services/       # Core business logic & AI Agent implementations
```

---

## Coding Conventions

- **TypeScript Strict Mode**: Strict mode is enabled in `tsconfig.json`. Ensure explicit types for parameters and return values.
- **Path Aliases**:
  - Use `@src/*` to reference `core-server/src/*`.
  - Use `@shared/*` to reference `/shared/*`.
- **Dependency Injection**: Pass dependencies explicitly through class constructors. Avoid creating global instances inside services or controllers.
- **Asynchronous Code**: Always use `async/await` for database, network, and queue operations.
- **Graceful Error Handling**: Ensure database connections, RabbitMQ channels, and HTTP listeners are cleanly closed during shutdown signals (`SIGINT`, `SIGTERM`).

---

## Testing & Build Instructions

### Type Checking & Build Validation
To validate TypeScript types and build the production distribution output:
```bash
cd core-server
npm run build
```

---

## Important Files

- [src/container.ts](file:///home/juhonam/workspace/AReX/core-server/src/container.ts): Dependency Injection container wiring all services and components.
- [src/index.ts](file:///home/juhonam/workspace/AReX/core-server/src/index.ts): Application entry point and process lifecycle management.
- [src/services/agents/assistant](file:///home/juhonam/workspace/AReX/core-server/src/services/agents/assistant): Reading assistant AI agent logic (RAG & Q&A).
- [src/services/agents/character](file:///home/juhonam/workspace/AReX/core-server/src/services/agents/character): Fictional character chat agent implementation.
- [dev.js](file:///home/juhonam/workspace/AReX/core-server/dev.js): Hot-reloading watcher for core-server and shared modules.

---

## Common Commands

```bash
# Start in hot-reloading development mode
npm run dev

# Build TypeScript to /dist
npm run build

# Start production server
npm start
```
