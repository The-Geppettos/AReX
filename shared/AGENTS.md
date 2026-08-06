# Shared Module (`/shared`)

The **Shared Module** contains common TypeScript interfaces, type definitions, and constant mappings shared between the **Core Server** (`/core-server`) and the **Frontend** (`/frontend`).

---

## Architecture & Integration

- **Zero-Dependency Module**: Contains lightweight, pure TypeScript type definitions and constants without runtime framework dependencies.
- **Path Aliasing**: Imported using the `@shared/*` path alias configured in `frontend/tsconfig.app.json` and `core-server/tsconfig.json`.

---

## Directory Structure & File Overview

- **[book.ts](file:///home/juhonam/workspace/AReX/shared/book.ts)**:
  - Data models for `Book`, `BookChapter`, `BookPage`, `BookUpload`, and `BookPageDetail`.
  - Type definitions for languages (`ko`, `en`), book statuses (`uploading`, `preprocessing`, `published`, etc.), and page transition types.
- **[chat.ts](file:///home/juhonam/workspace/AReX/shared/chat.ts)**:
  - Data models for `UserMessage`, `BotMessage`, `ChatHistory`, and `ChatMessage`.
  - Chat type definitions (`assistant`, `character`).
- **[messageBroker.ts](file:///home/juhonam/workspace/AReX/shared/messageBroker.ts)**:
  - Data schemas for RabbitMQ queue messages (`NLPPreProcessReq`, `NLPPreProcessRes`, `PostProcess`).

---

## Coding Conventions

- **Type Safety**: Prefer explicit TypeScript interfaces and union types over generic `any`.
- **Read-Only / Constants**: Define constant arrays using `as const` assertions (e.g. `export const LANGUAGES = ["ko", "en"] as const`).
- **Backward Compatibility**: Ensure changes to shared interfaces are reflected in both `core-server` and `frontend`.
