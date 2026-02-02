# ADR-0002: Require X-Email for user isolation

- Status: Accepted
- Date: 2026-02-02

## Context / Problem Statement

The backend must enforce per-user isolation and attribution for query history, metrics, and downloads. Authentication is handled by an upstream proxy (for example oauth2-proxy), and the backend should not accept unauthenticated requests.

## Decision

Require every request to include an `X-Email` header via shared middleware. Requests without it return HTTP 401.

## Key Drivers

- Enforce user-level isolation in query history and auditing.
- Keep the backend stateless with respect to auth and avoid duplicating auth logic.
- Align with infrastructure that already injects `X-Email`.

## Alternatives Considered

### Token-based auth handled by the backend
- Would require additional auth middleware, token validation, and secret management.
- Duplicates functionality already provided by the proxy layer.

### Anonymous access
- Breaks attribution and auditing requirements.
- Increases risk of cross-user data exposure.

## Consequences

Positive:
- Clear, consistent user identification across all endpoints.
- Simple backend implementation.

Negative:
- Requires local dev helpers (e.g., Vite proxy) to inject `X-Email`.

## Related Implementation and Constraints

- Auth middleware: `server/src/middleware/auth.ts`
- Server wiring (global middleware): `server/src/index.ts`
- Dev proxy injection: `precise/vite.config.ts`
- Dev/test scripts: `server/scripts/*.mjs`
