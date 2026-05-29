# Project Context

## Purpose

A reusable React + AWS Athena query editor. Browse data catalogs, write SQL, execute queries, inspect results — a self-hostable alternative to the AWS console's query editor with per-user history and downloadable result files.

Originally forked from `trinodb/trino-query-ui` (v0.2.0, 2025-12-16) and rewired for Athena.

## Tech Stack

- **Frontend (`precise/`):** React 19 + TypeScript, Vite, Monaco editor, ANTLR-generated SQL parser (Trino/Presto-derived grammar customised for Athena syntax), MUI.
- **Backend (`server/`):** Express + TypeScript, AWS SDK v3 (Athena + S3 + S3 presigner), PostgreSQL via `pg` for query history, `zod` for input validation.
- **Build/Deploy:** Multi-stage Dockerfile producing `ghcr.io/athena-query-labs/athena-query-editor`; arm64 and amd64 multi-arch.
- **Node:** v24+ enforced via `engines`.

## Project Conventions

### Code Style

TypeScript everywhere; 2-space indent; PascalCase components, camelCase variables. Frontend uses ESLint + Prettier (`npm run check`). Authoritative repo guide: [`AGENTS.md`](../AGENTS.md) (symlinked to `CLAUDE.md`).

### Architecture Patterns

Architectural decisions live as ADRs under [`docs/adr/`](../docs/adr/). The index in `docs/adr/README.md` is the entry point. Behaviour covered by an ADR (auth, polling, row caps, S3 key shape, presigning, pricing format, history key, error translation, multi-catalog) must be updated or a new ADR added whenever the behaviour changes.

### Testing Strategy

Validation primarily via `typecheck` + smoke/lifecycle scripts (`server/scripts/*.mjs`). Frontend has Vitest with a couple of grammar and tab-naming tests (`precise/tests/`). No backend unit-test framework; coverage is a known gap (see `workspace/journals/2026-05-athena-query-editor-maintenance/codex-review/03-testing-and-deploy.md`).

### Git Workflow

- Trunk-based on `main`; no long-lived feature branches.
- Commits are signed and signed-off: `git commit -s -S`.
- Conventional prefixes (`feat:` / `fix:` / `chore:` / `docs:`) are common but not enforced.

## Domain Context

- All requests carry `X-Email` (ADR-0002), injected by an upstream auth proxy (oauth2-proxy) in production or by the Vite dev proxy locally (ADR-0006). `/health` is the only unauthenticated route.
- The user identity is the isolation key for query history (`(user_email, query_execution_id)` upsert, ADR-0010).
- Results are CSV in S3; downloads use presigned URLs with a 15-minute TTL (ADR-0007).
- UI caps rendered rows at 10,000; full result set is reached via the download link (ADR-0009).

## Important Constraints

- Athena SDK call surface is currently narrow (7 of ~40 relevant operations). Multi-catalog metadata is enabled server-side (ADR-0013) but the frontend UI to switch catalogs is still pending.
- Workgroup is env-baked at startup (`ATHENA_WORKGROUP`); switching at runtime is not yet supported.
- Named Queries / Prepared Statements / runtime statistics are not surfaced — see review report for the full gap list.

## External Dependencies

- AWS Athena, AWS S3, AWS Glue Data Catalog (when using the default `AwsDataCatalog`).
- PostgreSQL (any v12+; tested with the AWS SDK-managed instance pattern).
- Optional: oauth2-proxy in front of the container for production auth.
