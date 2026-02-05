# Repository Guidelines

## Project Structure & Module Organization
- `precise/`: React + Vite frontend (TypeScript) with `src/` and `public/`.
- `server/`: Express + TypeScript Athena backend with `src/`, `migrations/`, `config/`, and `scripts/`.
- `docs/adr/`: Architecture Decision Records.
- `openspec/`: OpenSpec change artifacts.
- `dist/`: build outputs; rebuild after source changes, especially before smoke tests or `node dist/index.js`.

## Build, Test, and Development Commands
- Frontend (`precise/`): `npm run dev` (Vite), `npm run build` (build `dist/`), `npm run check` (lint/format), `npm run antlr4ng` (regen parser).
- Backend (`server/`): `npm run dev` (tsx watch), `npm run build` (compile), `npm run start` (run `dist/index.js`), `npm run test:smoke` / `npm run test:query` (integration scripts; server running).
- Type checks: `npm run typecheck` in both packages.

## Coding Style & Naming Conventions
- TypeScript throughout; follow existing patterns in `src/`.
- Use 2-space indentation and standard TS/React naming (PascalCase components, camelCase variables).
- Frontend uses ESLint and Prettier; prefer running `npm run check` before commits.

## Testing Guidelines
- No unit test framework is configured; validation is via `typecheck` + smoke/query scripts.
- Smoke tests expect `SMOKE_BASE_URL` and `SMOKE_USER_EMAIL`.

## Commit & Pull Request Guidelines
- Recent commits use short, imperative subjects; some use conventional prefixes like `chore:` or `docs:`. Follow that style.
- Commits must be signed and include a signed-off-by: use `git commit -s -S`.
- PRs should include a clear summary, testing notes, and screenshots or GIFs for UI changes.

## Athena Backend & UI Notes
- Auth: every API call must include `X-Email`. In dev, set `VITE_DEV_USER_EMAIL` and ensure the Vite proxy targets `/api` (not `/v1`).
- AWS credentials: set `AWS_PROFILE` in `.env` and verify with `aws sts get-caller-identity`. Required env: `AWS_REGION`, `ATHENA_WORKGROUP`, `ATHENA_OUTPUT_LOCATION`.
- Metadata APIs: `ListTableMetadata` enforces `MaxResults <= 50`; `ListDatabases` is paginated via `NextToken`.
- Query lifecycle: poll every 1s, timeout at 24h, cancel on timeout, and return `TIMEOUT` to the UI.
- Results: normalize output to `<prefix>/<queryId>.csv`; always try presigned URLs; return “no download available” if missing; mark partial downloads for FAILED/CANCELLED.
- Metrics: queue/exec seconds with 2 decimals, scanned size in GB with 2 decimals, cost from pricing config.
- Storage: run migrations to create `query_history` before server use; store by `user_email` + `query_execution_id`.
- Layout: keep Drawer `position: static` in a grid; keep the title/theme toggle in `precise/src/main.tsx` header outside `QueryEditor`.
