# Frontend (`/frontend`)

The **Frontend** provides the user interface for eBook reading, management, and interactive AI agent chat in AReX.

---

## Architecture & Design

Built with **React 19**, **TypeScript**, **Vite**, **MUI (Material UI)**, and **SCSS**.

### Key Features & Design Architecture
- **Dual-Entry Point Architecture**:
  - `index.html` -> [src/main](file:///home/juhonam/workspace/AReX/frontend/src/main): eBook management dashboard and upload system.
  - `bookreader.html` -> [src/bookreader](file:///home/juhonam/workspace/AReX/frontend/src/bookreader): Interactive page reader with sentence highlighting, character color-coding, and AI agent sidebars.
- **Routing & Proxying**:
  - `vite.config.ts` includes custom middleware to handle `/bookreader/` page routing.
  - Development proxy automatically routes `/api` requests to the Core Server backend (`core-server:13001` or `3001`).
- **Restricted Reader Mode (`VITE_NO_ADMIN`)**:
  Supports running with `VITE_NO_ADMIN=true` to hide book management and upload UI in restricted reader environments.

---

## Directory Structure

```
frontend/
├── index.html          # Entry HTML for dashboard
├── bookreader.html     # Entry HTML for eBook reader
├── vite.config.ts      # Vite configuration & proxy settings
├── eslint.config.js    # ESLint configuration
├── package.json        # Dependencies & scripts
└── src/
    ├── api/            # API client modules for interacting with core-server
    ├── bookreader/     # Book reader application (App.tsx, components, SCSS styles)
    ├── main/           # Dashboard application (App.tsx, components, theme)
    └── lib.ts          # Shared utility functions
```

---

## Coding Conventions

- **React & TypeScript**: Functional components with strict TypeScript prop types.
- **Path Aliases**:
  - `@src/*` points to `frontend/src/*`.
  - `@shared/*` points to `/shared/*`.
- **Styling**: Combine MUI components for structural UI and SCSS modules (`App.scss`, `const.scss`) for reader-specific layout and text formatting.
- **State & Data Flow**: Maintain clean local state for transient UI interactions; interact with backend via API modules in `src/api/`.

---

## Testing & Verification Instructions

### Linting & Build Validation
```bash
# Run ESLint across the codebase
npm run lint

# Validate TypeScript build and bundle with Vite
npm run build
```

---

## Important Files

- [vite.config.ts](file:///home/juhonam/workspace/AReX/frontend/vite.config.ts): Vite build config, path aliases, middleware routing, and proxy definitions.
- [src/main/App.tsx](file:///home/juhonam/workspace/AReX/frontend/src/main/App.tsx): Dashboard application component.
- [src/bookreader/App.tsx](file:///home/juhonam/workspace/AReX/frontend/src/bookreader/App.tsx): Main eBook reader interface component.
- [src/bookreader/App.scss](file:///home/juhonam/workspace/AReX/frontend/src/bookreader/App.scss): Reader custom styles.

---

## Common Commands

```bash
# Start Vite development server
npm run dev

# Run static linting checks
npm run lint

# Build production distribution
npm run build

# Preview production build locally
npm run preview
```
