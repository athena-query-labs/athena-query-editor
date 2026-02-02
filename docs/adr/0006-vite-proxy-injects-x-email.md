# ADR-0006: Use Vite proxy to inject X-Email in local dev

- Status: Accepted
- Date: 2026-02-02

## Context / Problem Statement

The backend requires `X-Email` on every request, but local development lacks the upstream auth proxy that normally injects it. Developers need a simple way to run the frontend against the backend without setting up full auth infrastructure.

## Decision

Configure the Vite dev server to proxy `/api` requests to the backend and inject `X-Email` using `VITE_DEV_USER_EMAIL` when set.

## Key Drivers

- Keep local dev friction low.
- Maintain parity with production request headers.
- Avoid conditional auth behavior in the backend.

## Alternatives Considered

### Disable auth checks in local dev
- Risks drift from production behavior.

### Add a separate dev-only auth bypass
- Introduces code paths that could leak into production if misconfigured.

## Consequences

Positive:
- Simple, consistent local setup.
- Backend remains strict about auth requirements.

Negative:
- Developers must remember to set `VITE_DEV_USER_EMAIL`.

## Related Implementation and Constraints

- Vite proxy config: `precise/vite.config.ts`
- Backend auth requirement: `server/src/middleware/auth.ts`

