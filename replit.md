# Workspace

## Overview

pnpm workspace monorepo using TypeScript. Each package manages its own dependencies.
GymFlow is a dark-themed fitness tracking mobile-first web app.

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
- **Frontend**: React + Vite + Tailwind CSS + shadcn/ui
- **Routing**: Wouter
- **Data fetching**: TanStack React Query

## Structure

```text
artifacts-monorepo/
├── artifacts/              # Deployable applications
│   ├── api-server/         # Express API server
│   └── gymflow/            # GymFlow React frontend
├── lib/                    # Shared libraries
│   ├── api-spec/           # OpenAPI spec + Orval codegen config
│   ├── api-client-react/   # Generated React Query hooks
│   ├── api-zod/            # Generated Zod schemas from OpenAPI
│   └── db/                 # Drizzle ORM schema + DB connection
├── scripts/                # Utility scripts
├── pnpm-workspace.yaml
├── tsconfig.base.json
├── tsconfig.json
└── package.json
```

## GymFlow App Features

- **Home**: Today's workout card (current day + workout type), all week days list, Start Workout button
- **Manage Days**: CRUD for workout days with emoji icons and workout types (Push/Pull/Legs/Rest/etc.)
- **Manage Machines**: CRUD for gym machines with optional images
- **Settings**: Change current day, language (English/Arabic), theme (Light/Dark)
- **Bottom Navigation**: 4 tabs — Home, Manage Days, Machines, Settings

## Database Schema

- `days` — id, day_name, workout_type, workout_icon, order_index
- `machines` — id, name, image_url
- `settings` — id (singleton row = 1), current_day, language, theme

## API Routes

- `GET/POST /api/days` — list/create days
- `PUT/DELETE /api/days/:id` — update/delete day
- `GET/POST /api/machines` — list/create machines
- `PUT/DELETE /api/machines/:id` — update/delete machine
- `GET /api/settings` — get settings
- `PUT /api/settings` — update settings

## TypeScript & Composite Projects

Every package extends `tsconfig.base.json` which sets `composite: true`. The root `tsconfig.json` lists all packages as project references. This means:

- **Always typecheck from the root** — run `pnpm run typecheck`
- **`emitDeclarationOnly`** — we only emit `.d.ts` files during typecheck
- **Project references** — when package A depends on package B, A's `tsconfig.json` must list B in its `references` array.

## Root Scripts

- `pnpm run build` — runs `typecheck` first, then recursively runs `build` in all packages that define it
- `pnpm run typecheck` — runs `tsc --build --emitDeclarationOnly` using project references
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API client and Zod schemas from OpenAPI spec
- `pnpm --filter @workspace/db run push` — push schema changes to database
