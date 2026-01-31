## 1. Server setup

- [ ] 1.1 Scaffold `server/` Express + TypeScript project (build, dev scripts)
- [ ] 1.2 Add config loader (env + file) including pricing config
- [ ] 1.3 Add request validation and centralized error middleware
- [ ] 1.4 Add oauth2-proxy header auth middleware (require `X-Email`)

## 2. Backend Athena integration

- [ ] 2.1 Add Athena SDK client setup using default credential chain
- [ ] 2.2 Implement StartQueryExecution endpoint with user-scoped query tracking
- [ ] 2.3 Implement GetQueryExecution polling and status mapping
- [ ] 2.4 Implement GetQueryResults pagination API
- [ ] 2.5 Implement StopQueryExecution cancel API
- [ ] 2.6 Implement presigned URL generation for S3 result file download
- [ ] 2.7 Expose query execution statistics (scanned bytes, queue/exec time, estimated cost)
- [ ] 2.8 Add polling timeout handling (24h) and cancel-on-timeout behavior
- [ ] 2.9 Add pagination default (100) and enforce max page size (1000)
- [ ] 2.10 Add presigned URL TTL (24h) and filename by query id
- [ ] 2.11 Detect partial result files for failed/cancelled queries and mark downloads as partial
- [ ] 2.12 Return explicit “no result file” response for failed/cancelled queries without output

## 3. Metadata browsing

- [ ] 3.1 Implement catalog listing endpoint (default catalog only)
- [ ] 3.2 Implement database listing endpoint
- [ ] 3.3 Implement table listing endpoint
- [ ] 3.4 Implement column/schema describe endpoint

## 4. Configuration & user isolation

- [ ] 4.1 Add required config validation (region, workgroup, S3 output location)
- [ ] 4.2 Add optional default catalog/database config
- [ ] 4.3 Enforce user isolation based on `X-Email`
- [ ] 4.4 Remove Trino backend selection and related routes
- [ ] 4.5 Add PostgreSQL storage for user query history
- [ ] 4.6 Define query history schema and migration (PG)
- [ ] 4.7 Add region-based pricing config for cost estimation
- [ ] 4.8 Load pricing config from file with fallback defaults

## 5. Frontend updates

- [ ] 5.1 Wire UI to new Athena endpoints for query execution flow
- [ ] 5.2 Update status/error display to Athena status mapping
- [ ] 5.3 Add download button for full result file (presigned URL)
- [ ] 5.4 Update metadata browser UI to use Athena endpoints
- [ ] 5.5 Show query stats (queue time, execution time, scanned bytes, estimated cost)
- [ ] 5.6 Indicate partial results in download UI when applicable
- [ ] 5.7 Show “no download available” message when result file is missing
- [ ] 5.8 Allow switching database within default catalog

## 6. Docs and validation

- [ ] 6.1 Update configuration docs for Athena settings and credential chain
- [ ] 6.2 Document oauth2-proxy `X-Email` header requirement
- [ ] 6.3 Add/adjust tests for query lifecycle, pagination, and download
