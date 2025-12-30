# Repository Guidelines

## Project Structure
- `src/app/`: Next.js App Router pages, layouts, and API routes (`src/app/api/*/route.ts`).
- `src/components/`: Reusable UI + feature components (e.g. `src/components/worker/*`, `src/components/company/*`).
- `src/server/`: Server-only logic and services (`src/server/services/*`), Prisma client (`src/server/db/*`).
- `src/lib/`: Shared utilities and Zod validators (`src/lib/validators/*`).
- `prisma/`: Prisma schema + migrations (`prisma/schema.prisma`, `prisma/migrations/*`).
- `public/`: Static assets.
- `tests/`: Vitest tests.

## Build, Test, and Development Commands
- `npm run dev`: Starts Next.js dev server. Also boots local Postgres via Docker Compose when needed and applies migrations/seed.
- `npm run build`: Production build.
- `npm run start`: Runs the built app.
- `npm run lint`: ESLint (must pass).
- `npm run test`: Runs Vitest in CI mode.
- `npm run db:up` / `npm run db:down`: Start/stop dev Postgres (Docker).
- `npm run db:deploy`: Apply Prisma migrations (`prisma migrate deploy`).

## Coding Style & Naming Conventions
- TypeScript + React (Next.js App Router). Prefer small, focused modules.
- **Hard rule:** keep files ≤ 300 lines; split into modules when necessary.
- Use existing patterns:
  - Validators in `src/lib/validators/*` (Zod)
  - Domain logic in `src/server/services/*`
  - API routes in `src/app/api/*/route.ts`
  - Shared types/enums in `src/types/index.ts`
- Naming: `kebab-case` for file names, `PascalCase` for React components, `camelCase` for functions/vars.

## Testing Guidelines
- Framework: Vitest (`tests/*.test.ts`).
- Prefer service-level tests for domain logic (mock Prisma via existing test setup).
- Run: `npm run test` (add tests when changing matching/eligibility or validators).

## Commit & Pull Request Guidelines
- This repo is not a Git checkout in this environment, so history-based conventions are unavailable.
- Suggested: imperative commit subjects (e.g. “Add worker prefs endpoint”), PRs include:
  - What changed + how to test
  - Screenshots for UI changes
  - Notes for DB migrations (if any)

## Configuration & Security Notes
- Local config in `.env` (DB + NextAuth). Do not commit secrets.
- For a clean dev reset: `docker compose down -v` then `npm run dev`.

