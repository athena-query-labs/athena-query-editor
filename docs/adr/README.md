# Architecture Decision Records (ADR)

This folder contains Architecture Decision Records (ADRs) that capture the key technical decisions made in this repository.

## Index

Backend
- ADR-0001: Use PostgreSQL for query history storage (`0001-use-postgresql-for-query-history.md`)
- ADR-0002: Require X-Email for user isolation (`0002-require-x-email-header.md`)
- ADR-0003: Poll Athena status with timeout and cancellation (`0003-poll-athena-status-with-timeout.md`)
- ADR-0004: Normalize Athena S3 output location for downloads (`0004-normalize-s3-output-location-for-downloads.md`)
- ADR-0005: Cap ListTableMetadata MaxResults to 50 (`0005-limit-listtablemetadata-maxresults.md`)
- ADR-0007: Use presigned S3 URLs for query result downloads (`0007-use-presigned-downloads-for-query-results.md`)
- ADR-0008: Format query metrics and estimate cost in the API (`0008-format-metrics-and-estimate-cost.md`)
- ADR-0010: Upsert query history by user and execution ID (`0010-upsert-query-history-by-user-and-execution-id.md`)

Frontend
- ADR-0006: Use Vite proxy to inject X-Email in local dev (`0006-vite-proxy-injects-x-email.md`)
- ADR-0009: Cap UI result rendering at 10,000 rows (`0009-cap-ui-results-at-10000-rows.md`)
- ADR-0011: Switch frontend build to application output (`0011-switch-frontend-to-app-build.md`)

## Naming and Format

- File name pattern: `NNNN-short-title.md` (e.g. `0001-use-postgresql-for-query-history.md`)
- ADR title format: `ADR-NNNN: <Title>`
- Status: one of `Proposed`, `Accepted`, `Deprecated`, or `Superseded`
- Date: `YYYY-MM-DD`

## Adding a New ADR

1) Copy an existing ADR as a starting point.
2) Increment the ADR number.
3) Fill in context, decision, alternatives, and consequences.
4) Add the new ADR to the Index above.
