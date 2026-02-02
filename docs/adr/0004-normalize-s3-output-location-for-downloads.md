# ADR-0004: Normalize Athena S3 output location for downloads

- Status: Accepted
- Date: 2026-02-02

## Context / Problem Statement

Athena output locations can be configured as either a bucket or a prefix. The backend must produce consistent, predictable download URLs for query results regardless of how the output location is specified.

## Decision

Normalize the output location to a concrete object key in the form `<prefix>/<queryId>.csv`. If the configured output location ends with `/`, append `<queryId>.csv`; if it points to a prefix without a file suffix, append `/<queryId>.csv`. If the location already ends with `.csv` or `.txt`, keep it unchanged.

## Key Drivers

- Ensure downloads work whether the output location is a bucket or a prefix.
- Avoid missing objects when the output location omits a filename.
- Keep URL generation deterministic for the UI.

## Alternatives Considered

### Assume a fully qualified file path
- Breaks when operators set only a bucket or prefix.

### Store output paths from Athena only
- Athena may still return a prefix-like location; requires normalization anyway.

## Consequences

Positive:
- Stable download behavior across configuration styles.
- Fewer support issues for misconfigured output locations.

Negative:
- Assumes CSV naming convention for output objects.

## Related Implementation and Constraints

- Output parsing and normalization: `server/src/routes/query.ts`
- S3 helpers: `server/src/s3.ts`
