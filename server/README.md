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

## Migrations

Apply `migrations/001_create_query_history.sql` to provision query history storage.

## Run (dev)

```
npm install
npm run dev
```
