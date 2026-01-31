## 1. Server setup

- [x] 1.1 Scaffold `server/` Express + TypeScript project (build, dev scripts)
- [x] 1.2 Add config loader (env + file) including pricing config
- [x] 1.3 Add request validation and centralized error middleware
- [x] 1.4 Add oauth2-proxy header auth middleware (require `X-Email`)

## 2. Backend Athena integration

- [x] 2.1 Add Athena SDK client setup using default credential chain
- [x] 2.2 Implement StartQueryExecution endpoint with user-scoped query tracking
- [x] 2.3 Implement GetQueryExecution polling and status mapping
- [x] 2.4 Implement GetQueryResults pagination API
- [x] 2.5 Implement StopQueryExecution cancel API
- [x] 2.6 Implement presigned URL generation for S3 result file download
- [x] 2.7 Expose query execution statistics (scanned bytes, queue/exec time, estimated cost)
- [x] 2.8 Add polling timeout handling (24h) and cancel-on-timeout behavior
- [x] 2.9 Add pagination default (100) and enforce max page size (1000)
- [x] 2.10 Add presigned URL TTL (24h) and filename by query id
- [x] 2.11 Detect partial result files for failed/cancelled queries and mark downloads as partial
- [x] 2.12 Return explicit “no result file” response for failed/cancelled queries without output

## 3. Metadata browsing

- [x] 3.1 Implement catalog listing endpoint (default catalog only)
- [x] 3.2 Implement database listing endpoint
- [x] 3.3 Implement table listing endpoint
- [x] 3.4 Implement column/schema describe endpoint

## 4. Configuration & user isolation

- [x] 4.1 Add required config validation (region, workgroup, S3 output location)
- [x] 4.2 Add optional default catalog/database config
- [x] 4.3 Enforce user isolation based on `X-Email`
- [x] 4.4 Remove Trino backend selection and related routes
- [x] 4.5 Add PostgreSQL storage for user query history
- [x] 4.6 Define query history schema and migration (PG)
- [x] 4.7 Add region-based pricing config for cost estimation
- [x] 4.8 Load pricing config from file with fallback defaults

## 5. Frontend updates

- [x] 5.1 Wire UI to new Athena endpoints for query execution flow
- [x] 5.2 Update status/error display to Athena status mapping
- [x] 5.3 Add download button for full result file (presigned URL)
- [x] 5.4 Update metadata browser UI to use Athena endpoints
- [x] 5.5 Show query stats (queue time, execution time, scanned bytes, estimated cost)
- [x] 5.6 Indicate partial results in download UI when applicable
- [x] 5.7 Show “no download available” message when result file is missing
- [x] 5.8 Allow switching database within default catalog

## 6. Docs and validation

- [x] 6.1 Update configuration docs for Athena settings and credential chain
- [x] 6.2 Document oauth2-proxy `X-Email` header requirement
- [x] 6.3 Add/adjust tests for query lifecycle, pagination, and download
