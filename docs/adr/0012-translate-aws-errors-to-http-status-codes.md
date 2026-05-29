# ADR-0012: Translate AWS errors to HTTP status codes and mask sensitive details

- Status: Accepted
- Date: 2026-05-29

## Context / Problem Statement

The Express error-handling middleware previously returned every uncaught error as `HTTP 500 { error: err.message }`. This had two problems:

1. **UX**: client-fixable problems (bad SQL, missing table, throttling) were indistinguishable from real server bugs. The frontend could not, for example, surface a 4xx for the user to retry without bothering an operator.
2. **Security**: AWS SDK errors include account IDs, IAM role ARNs, workgroup names, and service URLs. Returning these verbatim leaks AWS reconnaissance fodder to any authenticated user.

The Codex review (`workspace/journals/2026-05-athena-query-editor-maintenance/codex-review/REPORT.md` finding #2) flagged this as a high-severity gap surfaced independently by three reviewers.

## Decision

The global error handler translates errors by class/name before responding:

| Error class / `err.name` | HTTP status | Body |
|---|---|---|
| `ZodError` (request body / query schema) | `400` | `{ error: 'Invalid request', issues }` — preserve field-level issues |
| `InvalidRequestException` (Athena) | `400` | `{ error: <message> }` — surface (SQL syntax / parameter errors, user-fixable) |
| `ResourceNotFoundException` | `404` | `{ error: 'Resource not found' }` |
| `AccessDeniedException` | `403` | `{ error: 'Access denied (check server IAM permissions)' }` — mask ARNs/account IDs |
| `TooManyRequestsException` | `429` + `Retry-After: 5` | `{ error: 'Athena rate limit reached, retry shortly' }` |
| `InternalServerException` | `502` | `{ error: 'Athena service unavailable' }` |
| Anything else | `500` | `{ error: 'Internal error' }` |

The full error (including stack and AWS request ID) is always logged server-side via `console.error` for operator debugging.

## Key Drivers

- Stop leaking AWS account IDs / IAM ARNs / workgroup names in 5xx responses.
- Let the UI distinguish 4xx (user-fixable) from 5xx (server problem).
- Preserve user-facing SQL error messages (Athena's `InvalidRequestException` carries actionable parser output like `"line 3:14: mismatched input 'FORM'. Expecting: 'FROM'"`).

## Alternatives Considered

### Mask all error messages uniformly
- Safer (zero leak risk) but loses SQL error feedback that the user needs to fix their own query.
- Rejected as too pessimistic given Athena's `InvalidRequestException` payload is genuinely user-facing.

### Per-route try/catch with custom mappings
- More flexibility but duplicates the mapping across every handler.
- Rejected; the central middleware is sufficient.

### Inject a correlation ID and only log server-side
- Useful follow-up but orthogonal to this decision; tracked as part of the structured-logging gap (see review report's Wave 6).

## Consequences

Positive:
- AWS errors no longer leak account-level identifiers to the client.
- Clients can distinguish retryable (`429`), permission (`403`), client-error (`400`), and service-fault (`5xx`) classes.
- `Retry-After` header lets well-behaved clients back off automatically on throttling.

Negative:
- The mapping table must be kept current as AWS adds new exception types.
- `InvalidRequestException` messages are passed through verbatim — they may rarely contain ARN-like strings (e.g. workgroup-not-found). Acceptable trade-off vs losing SQL syntax feedback.

## Related Implementation and Constraints

- Error middleware: `server/src/index.ts` (final `app.use`)
- AWS error names: `@aws-sdk/client-athena` throws subclasses of `AthenaServiceException` whose `name` property matches the AWS exception name.
- Zod validation: each route uses `schema.parse(...)` which throws `ZodError` on bad input; the middleware catches that uniformly.
