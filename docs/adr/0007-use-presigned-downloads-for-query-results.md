# ADR-0007: Use presigned S3 URLs for query result downloads

- Status: Accepted
- Date: 2026-02-02

## Context / Problem Statement

Query results can be large and should be downloaded directly from S3. The backend should not proxy large result files, and the UI needs a predictable way to know whether a download is available.

## Decision

Provide downloads via presigned S3 URLs. If the result object does not exist, return `available: false`. If a query ended in `FAILED` or `CANCELLED`, return `partial: true` to warn the UI that a partial file may be present.

## Key Drivers

- Avoid routing large result files through the API server.
- Use S3 as the system of record for result artifacts.
- Provide clear availability and partial-file signals to the UI.

## Alternatives Considered

### Proxy the download through the backend
- Increases server load and complexity.
- Adds unnecessary bandwidth cost on the API tier.

### Always return a URL
- Produces confusing failures when the object does not exist.

## Consequences

Positive:
- Efficient, scalable downloads.
- The UI can handle missing or partial results explicitly.

Negative:
- Requires S3 permissions for `HeadObject` and `GetObject`.

## Related Implementation and Constraints

- Download endpoint: `server/src/routes/query.ts`
- S3 helpers: `server/src/s3.ts`
- UI download trigger: `precise/src/ResultSet.tsx`

