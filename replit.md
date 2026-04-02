# Workspace

## Overview

pnpm workspace monorepo using TypeScript. Each package manages its own dependencies.
This is the **Jadi.ia** project — a PT-BR platform for creating websites, systems, web apps, and mobile applications with AI assistance (Groq).

## Stack

- **Monorepo tool**: pnpm workspaces
- **Node.js version**: 24
- **Package manager**: pnpm
- **TypeScript version**: 5.9
- **API framework**: Express 5
- **Database**: PostgreSQL + Drizzle ORM
- **Validation**: Zod (`zod/v4`), `drizzle-zod`
- **API codegen**: Orval (from OpenAPI spec)
- **Build**: esbuild (CJS bundle)
- **Frontend**: React + Vite + TailwindCSS + shadcn/ui
- **AI**: Groq API (requires `GROQ_API_KEY` env var)
- **Auth**: Bearer token (in-memory sessions via Map, stored in localStorage)

## Structure

```text
artifacts-monorepo/
├── artifacts/
│   ├── api-server/         # Express API server (port from $PORT, default 8080)
│   └── jadi-ia/            # React+Vite SPA frontend
├── lib/                    # Shared libraries
│   ├── api-spec/           # OpenAPI spec + Orval codegen config
│   ├── api-client-react/   # Generated React Query hooks
│   ├── api-zod/            # Generated Zod schemas from OpenAPI
│   └── db/                 # Drizzle ORM schema + DB connection
├── attached_assets/        # Logo images (logo.png, logo_sem_fundo_branca*.jpg)
├── pnpm-workspace.yaml
├── tsconfig.base.json
└── replit.md
```

## TypeScript & Composite Projects

Every package extends `tsconfig.base.json` which sets `composite: true`. The root `tsconfig.json` lists all packages as project references. Always typecheck from root: `pnpm run typecheck`.

When running `tsc --noEmit` in a sub-package, first build the api-client-react declarations: `cd lib/api-client-react && npx tsc -p tsconfig.json`

## Root Scripts

- `pnpm run build` — runs `typecheck` first, then recursively runs `build` in all packages that define it
- `pnpm run typecheck` — runs `tsc --build --emitDeclarationOnly` using project references

## Packages

### `artifacts/api-server` (`@workspace/api-server`)

Express 5 API server. Routes in `src/routes/`. Runs on port from `$PORT` env.

Routes:
- `/api/auth/*` — register, login, logout, me
- `/api/projects/*` — CRUD projects
- `/api/projects/:id/files/*` — CRUD project files
- `/api/projects/:id/secrets/*` — CRUD project secrets
- `/api/ai/chat` — AI chat (Groq)
- `/api/ai/generate-prompt` — prompt generator (Groq)
- `/api/stats/dashboard` — dashboard stats
- `/api/stats/activity` — recent activity
- `/api/healthz` — health check

Auth: Bearer token stored in-memory `Map<token, userId>`. `requireAuth` middleware validates.

**IMPORTANT**: Requires `GROQ_API_KEY` env var for AI features.

### `artifacts/jadi-ia` (`@workspace/jadi-ia`)

React + Vite SPA, entirely in PT-BR. Pages:
- `/` — Landing page (Home)
- `/login` — Login page
- `/registro` — Registration page
- `/dashboard` — User dashboard (projects list + stats)
- `/projetos/novo` — Create new project
- `/projetos/:id` — Code editor + AI chat + secrets + git tab
- `/perfil` — User profile

Features:
- Dark/light theme toggle (ThemeProvider)
- AuthProvider with Bearer token via localStorage
- Code editor with line numbers, Tab key support, Ctrl+S save
- AI chat panel (Groq via api-server)
- File manager sidebar
- Secrets manager sidebar
- Git tab (placeholder)
- Framer Motion animations

### `lib/db` (`@workspace/db`)

PostgreSQL via Drizzle ORM.

Schema tables:
- `users` — id, name, email, passwordHash, createdAt, updatedAt
- `projects` — id, userId, name, description, language, theme, isPublic, createdAt, updatedAt
- `project_files` — id, projectId, name, content, language, createdAt, updatedAt
- `project_secrets` — id, projectId, key, value, createdAt, updatedAt
- `activity_logs` — id, userId, type, description, projectId, projectName, createdAt

Push schema: `pnpm --filter @workspace/db run push`

### `lib/api-spec` (`@workspace/api-spec`)

OpenAPI 3.1 spec (`openapi.yaml`) + Orval config.
Run codegen: `pnpm --filter @workspace/api-spec run codegen`

### `lib/api-client-react` (`@workspace/api-client-react`)

Generated React Query hooks. Exports `setAuthTokenGetter` for Bearer token setup.
Build declarations: `cd lib/api-client-react && npx tsc -p tsconfig.json`
