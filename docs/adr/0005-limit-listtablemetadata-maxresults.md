# ADR-0005: Cap ListTableMetadata MaxResults to 50

- Status: Accepted
- Date: 2026-02-02

## Context / Problem Statement

Athena's `ListTableMetadata` API enforces a maximum `MaxResults` value of 50. Larger values return validation errors. The metadata API should be reliable and not expose this limit as a user-facing error.

## Decision

Hard-code `MaxResults` to 50 for `ListTableMetadata` requests.

## Key Drivers

- Avoid validation errors from Athena.
- Keep metadata browsing stable and predictable.

## Alternatives Considered

### Make `MaxResults` configurable
- Misconfiguration could reintroduce validation errors.

### Omit `MaxResults`
- Delegates default behavior to Athena; still limited and less explicit.

## Consequences

Positive:
- Consistent behavior across environments.
- Fewer support issues related to metadata browsing.

Negative:
- Pagination beyond 50 tables would require follow-up work (not implemented).

## Related Implementation and Constraints

- Metadata route: `server/src/routes/metadata.ts`

