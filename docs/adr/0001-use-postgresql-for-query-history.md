# ADR-0001: Use PostgreSQL for query history storage

- Status: Accepted
- Date: 2026-02-02

## Context / Problem Statement

The backend service must persist query history and execution records (for example `query_history`) and support filtering/aggregation by user, time range, and status. Data must be consistent and auditable on write, and the model should support future reporting and audit use cases.

## Decision

Use PostgreSQL as the database for query history and related metadata.

## Key Drivers

1) The data model is relational by nature
- Clear one-to-many relationships between users and execution records
- Uniqueness requirements such as `user_email + query_execution_id`

2) Consistency and transactional guarantees
- Writes and updates require strong consistency
- Reliable transactions are needed to ensure record integrity

3) Query and analytics needs
- Frequent filtering and aggregation by user, time window, and status
- SQL and mature indexing strategies are well-suited to this workload

4) Operational ecosystem and compliance
- PostgreSQL is common in enterprise environments with mature tooling for backup, audit, and access control
- Easier downstream integration with BI/reporting

5) Team fit and cost
- The team already has PostgreSQL operational experience
- Avoids additional deployment and operational complexity from MongoDB

## Alternatives Considered

### MongoDB
- The data structure is stable and relational; document flexibility is less valuable here
- Complex aggregation/reporting is more straightforward in a relational database
- Consistency and transactional semantics would require additional design constraints

### File storage / S3
- Poor fit for high-frequency writes and complex queries
- Hard to support reliable deduplication, updates, and audit requirements

## Consequences

Positive:
- Explicit schema improves data quality and consistency
- Complex queries and reporting are easier to implement and optimize
- Mature operational and monitoring tooling

Negative:
- Requires maintaining migrations and schema change workflows
- Less flexible than a document database

## Related Implementation and Constraints

- `query_history` must be created via migration before the service starts
- Records are stored and indexed by `user_email + query_execution_id`
- Backend APIs require `X-Email` for user-level isolation

Implementation references:

- Migration: `server/migrations/001_create_query_history.sql`
- DB connection: `server/src/db.ts`
- Read/write logic: `server/src/history.ts`
- API routes: `server/src/routes/history.ts`
- Operations notes: `server/README.md`
