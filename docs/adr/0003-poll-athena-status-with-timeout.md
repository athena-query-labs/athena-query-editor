# ADR-0003: Poll Athena status with timeout and cancellation

- Status: Accepted
- Date: 2026-02-02

## Context / Problem Statement

Athena queries are asynchronous and can run for a long time. The UI needs near-real-time status updates, but the system must avoid indefinite polling and handle runaway executions.

## Decision

Poll query status every 1 second in the frontend. On the backend, enforce a 24-hour timeout (based on submission time) for queries still in `QUEUED` or `RUNNING`; on timeout, cancel the query and return state `TIMEOUT`. The UI treats `TIMEOUT` as a terminal state.

## Key Drivers

- Provide responsive UI feedback with small latency.
- Prevent runaway or stuck queries from consuming resources indefinitely.
- Keep behavior consistent across UI and API consumers.

## Alternatives Considered

### Longer polling intervals (e.g., 5-10s)
- Reduces load but increases UI latency and user uncertainty.

### Backend-only polling
- Would shift state management to the server and complicate the API contract.

### No timeout
- Risks unbounded resource usage and poor operational hygiene.

## Consequences

Positive:
- Predictable UI updates and clearer user experience.
- Queries are force-stopped after a reasonable limit.

Negative:
- Polling introduces steady API traffic (1 request/second per running query).

## Related Implementation and Constraints

- Frontend polling and terminal states: `precise/src/AsyncAthenaClient.tsx`
- Backend timeout/cancel: `server/src/routes/query.ts`
