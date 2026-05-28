# Repository Guidelines

`CLAUDE.md` is a symlink to this file. Edit here, not there.

## Layout

- `precise/` — React + Vite frontend (TS, Node ≥24). Published as npm `athena-query-editor` and also built into a static bundle that the server serves.
- `server/` — Express + TS Athena backend (private package `athena-query-ui-server`).
- `docs/adr/` — Architecture Decision Records. **Authoritative for behavior rules** (auth header, polling cadence, row caps, output-key normalization, presigning, pricing format, history upsert key, etc.). Read the index before changing any of those.
- `Dockerfile` — multi-stage build; copies `precise/dist` into `server/public`. Container listens on `8081`.

## Commands

Frontend (`precise/`):
- `npm run dev` — Vite dev server; proxies `/api` to `localhost:8081` and injects `X-Email` from `VITE_DEV_USER_EMAIL`.
- `npm run build` / `npm run typecheck` / `npm run check` (install + lint + prettier) / `npm run test:unit` (vitest).
- `npm run antlr4ng` — regenerate the SQL parser into `src/generated/` after editing `trino/SqlBase.g4`.

Backend (`server/`):
- `npm run dev` (tsx watch) / `npm run build` / `npm run start` / `npm run typecheck`.
- `npm run test:smoke` / `npm run test:query` — need a running server plus `SMOKE_BASE_URL` + `SMOKE_USER_EMAIL`. `test:query` also needs live Athena; `SMOKE_CANCEL_QUERY` exercises the cancel path.
- **Rebuild `dist/` before `npm run start` or any smoke test.**

Pre-commit hook: `git config core.hooksPath .githooks` once — it runs both typechecks plus precise lint.

## Environment

Required: `AWS_REGION`, `ATHENA_WORKGROUP`, `ATHENA_OUTPUT_LOCATION`. PostgreSQL via `DATABASE_URL` or `PG*` vars. Verify AWS creds with `aws sts get-caller-identity` before running locally (`AWS_PROFILE` in `server/.env`). Other env vars: see `server/README.md`.

Every API call must carry `X-Email` (ADR-0002). Production: oauth2-proxy injects it. Dev: Vite proxy injects from `VITE_DEV_USER_EMAIL` (ADR-0006). The Vite proxy target is `/api`, **not** `/v1`.

## Style

- TypeScript everywhere, 2-space indent, PascalCase components / camelCase vars.
- ESLint + Prettier on the frontend; run `npm run check` before committing.

## Commits & PRs

- Short imperative subjects; `feat:` / `fix:` / `chore:` / `docs:` prefixes are common.
- **Sign and sign off every commit: `git commit -s -S`.**
- `.git/index.lock` may need elevated perms — prefer one chained `git add ... && git commit -s -S ... && git push` to avoid repeat approvals.
- PRs: summary + testing notes + screenshots/GIFs for UI changes.

## Non-obvious invariants (don't break these without thinking)

- `precise/src/main.tsx` mounts the page header (title + theme toggle) **outside** `QueryEditor`. Keep them separated.
- `QueryEditor.tsx` Drawer is `position: static` inside a grid layout. Don't switch it to overlay / temporary.
- `AsyncAthenaClient.tsx` is the active API client; `AsyncTrinoClient.tsx` is a historical sibling kept for parity — don't add new features to it.
- The SQL parser under `precise/src/generated/` is ANTLR-generated from `precise/trino/SqlBase.g4`. Don't hand-edit; rerun `npm run antlr4ng`.
- Express serves static from `process.cwd()/public`. Local `npm run start` only mirrors the Docker layout after `precise` is built into `server/public` — otherwise just use `npm run dev` for the frontend.
- Behavior covered by an ADR (auth, polling, row caps, S3 key shape, presigning, pricing format, history key, etc.) — **update or add an ADR in `docs/adr/` and link it from the index whenever you change it.**
