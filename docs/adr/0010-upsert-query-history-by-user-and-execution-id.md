# ADR-0010: Upsert query history by user and execution ID

- Status: Accepted
- Date: 2026-02-02

## Context / Problem Statement

Query status is polled and updated over time. The backend may receive multiple updates for the same query execution, and these updates must be idempotent while preserving per-user isolation.

## Decision

Store query history keyed by `(user_email, query_execution_id)` and use an upsert strategy on updates. Each write inserts the record if missing, or updates mutable fields (status, metrics, timestamps) when the record already exists.

## Key Drivers

- Support frequent status updates without duplicate rows.
- Ensure per-user isolation for query history.
- Keep the write path simple and reliable under polling.

## Alternatives Considered

### Append-only history
- Requires additional cleanup and complicates “latest state” queries.

### Single key on `query_execution_id`
- Risks cross-user collisions if multiple users run the same query ID in different contexts.

## Consequences

Positive:
- Idempotent writes and stable history queries.
- Simplifies UI history display and updates.

Negative:
- Requires a compound unique index and careful upsert logic.

## Related Implementation and Constraints

- Upsert logic: `server/src/history.ts`
- Table definition and indexes: `server/migrations/001_create_query_history.sql`

