# Athena Backend (server/)

Express + TypeScript service that proxies Athena APIs and adds:
- user isolation via `X-Email` (oauth2-proxy)
- query history persistence in PostgreSQL
- S3 presigned URL downloads for full results
- metadata browsing (databases/tables/columns)

## Environment

Required:

```
AWS_REGION
ATHENA_WORKGROUP
ATHENA_OUTPUT_LOCATION
```

PostgreSQL (one of):

```
DATABASE_URL
```

or

```
PGHOST
PGPORT
PGUSER
PGPASSWORD
PGDATABASE
```

Optional:

```
ATHENA_DEFAULT_CATALOG=AwsDataCatalog
ATHENA_DEFAULT_DATABASE=
ATHENA_PRICING_FILE=config/athena-pricing.json
PORT=8081
```

## IAM permissions (minimum)

The AWS credentials used by this service need permissions for:

Athena:
- `athena:StartQueryExecution`
- `athena:GetQueryExecution`
- `athena:GetQueryResults`
- `athena:StopQueryExecution`
- `athena:ListDataCatalogs`
- `athena:ListDatabases`
- `athena:ListTableMetadata`
- `athena:GetTableMetadata`
- `athena:GetWorkGroup` (workgroup is passed on `StartQueryExecution` and `ListTableMetadata`; AWS requires read access to the workgroup to validate it)

Glue (default `AwsDataCatalog` delegates metadata reads to Glue):
- `glue:GetDatabase`
- `glue:GetDatabases`
- `glue:GetTable`
- `glue:GetTables`
- `glue:GetPartitions` (only needed if/when partition browsing is added)

S3 (for Athena output + downloads):
- `s3:PutObject` on the output location bucket/prefix (Athena writes the result file using this service's role)
- `s3:GetObject` on the output location bucket/prefix (covers `HeadObject` too — `HeadObject` is not a separate IAM action)
- `s3:ListBucket` on the bucket (optional, for some SDK behaviors)

## Metadata API mapping

The metadata routes proxy directly to Athena APIs:

- `GET /api/metadata/catalogs` → `ListDataCatalogs`
- `GET /api/metadata/databases?catalog=<name>` → `ListDatabases` (catalog optional, falls back to `ATHENA_DEFAULT_CATALOG`)
- `GET /api/metadata/tables?catalog=<name>&database=<db>` → `ListTableMetadata`
- `GET /api/metadata/columns?catalog=<name>&database=<db>&table=<table>` → `GetTableMetadata`

## Health endpoint

`GET /health` returns `{ "ok": true }` and is **unauthenticated** (registered before the `X-Email` middleware) so that orchestrator probes (Docker `HEALTHCHECK`, Kubernetes liveness/readiness, load-balancer pings) work without injecting `X-Email`. The endpoint has no side effects. See ADR-0002.

## Migrations

Apply `migrations/001_create_query_history.sql` to provision query history storage.

## Architecture decisions

See `docs/adr/README.md` for decision records that apply to the backend.

## Run (dev)

```
npm install
npm run dev
```

## Smoke test

Run with a live server:

```
SMOKE_BASE_URL=http://localhost:8081 SMOKE_USER_EMAIL=you@example.com npm run test:smoke
```

## Query lifecycle test

Requires a running server and Athena access:

```
SMOKE_BASE_URL=http://localhost:8081 SMOKE_USER_EMAIL=you@example.com npm run test:query
```

Optional cancel test:

```
SMOKE_CANCEL_QUERY="SELECT * FROM sample_table LIMIT 100000" \
  SMOKE_BASE_URL=http://localhost:8081 \
  SMOKE_USER_EMAIL=you@example.com \
  npm run test:query
```

You can also set `SMOKE_CANCEL_QUERY` in `server/.env` for local runs.
