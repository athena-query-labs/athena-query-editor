# Athena Query Editor

A reusable React query editor for AWS Athena.
This repository includes an Athena backend service (in `server/`)
and a frontend adapted to Athena APIs.

The component can be embedded into any React application and configured to proxy
requests to a local or remote Athena backend.

> [!WARNING]
> This package is under heavy development and is not yet recommended for
> production workloads. Treat the current release as an early-stage demo;
> production-ready builds and documentation are planned.

![Athena Query Editor](screenshot.png "Athena Query Editor")

## Athena backend (server/)

The Athena backend is an Express + TypeScript service under `server/`.
It expects an auth proxy (e.g. oauth2-proxy) to inject `X-Email` on all requests.

Required environment variables:

```
AWS_REGION
ATHENA_WORKGROUP
ATHENA_OUTPUT_LOCATION
```

Optional:

```
ATHENA_DEFAULT_CATALOG=AwsDataCatalog
ATHENA_DEFAULT_DATABASE=
ATHENA_PRICING_FILE=config/athena-pricing.json
```

Frontend dev (Vite) header injection:

```
VITE_DEV_USER_EMAIL=you@example.com
```

Backend smoke test (server must be running):

```
SMOKE_BASE_URL=http://localhost:8081 SMOKE_USER_EMAIL=you@example.com npm run test:smoke
```

Backend query lifecycle test:

```
SMOKE_BASE_URL=http://localhost:8081 SMOKE_USER_EMAIL=you@example.com npm run test:query
```

Implementation details:

* React TypeScript project with Vite
* Uses Node.js v24+
* Monaco editor + ANTLR parser using a Trino-compatible SQL grammar (Athena SQL)

## Architecture Decision Records (ADR)

ADR stands for Architecture Decision Record. See the index in `docs/adr/README.md`.

## Features

* Browse metadata about catalogs, schemas, tables, and more
* Search across catalogs
* Set queries session context.
* Inspect data with generated queries
* Preview sample data
* Write queries manually with schema-aware SQL syntax completion and
  highlighting
* Use multiple query tabs
* View schema information in SQL queries via mouse-over hovering
* Format SQL queries in the editor
* Copy result set table data to the clipboard
* Monitor query execution status, timing, and metrics

See details in the [demo animation](./demos.gif).

## Installation

```shell
npm install athena-query-editor
```

## Quick start

```tsx
import { QueryEditor } from 'athena-query-editor'
import 'athena-query-editor/dist/index.css'

function MyAthenaApp() {
  return <QueryEditor theme="dark" height={800} />
}

export default MyAthenaApp
```

## Building for integration

```shell
cd precise
npm install
npm run build
```

The compiled assets are in `precise/dist/`.

## Development

### Git hooks (recommended)

Enable local hooks to run type checks and linting on commit:

```shell
git config core.hooksPath .githooks
```

### Build and run

1. Install Node.js (v20 or newer) from <https://nodejs.org/en/download/>
2. Start the Athena backend with the required environment variables:

```shell
cd server
npm install
npm run dev
```

3. Install the frontend dependencies and run the dev server:

```shell
cd precise
npm install
npm run dev
```

The local URL is displayed, and you can open it in your browser.

### Set up proxying to a local Athena backend

By default `precise/vite.config.ts` proxies `/api` to `http://localhost:8081`
and injects `X-Email` when `VITE_DEV_USER_EMAIL` is set. Modify as needed:

```tsx
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:8081',
        changeOrigin: true,
        secure: false,
        headers: process.env.VITE_DEV_USER_EMAIL
          ? { 'X-Email': process.env.VITE_DEV_USER_EMAIL }
          : undefined,
      },
    },
  },
});
```

### Building the parser

Build the parser, as configured in **package.json**.

```shell
npm run antlr4ng
```

### Linting and code formatting

To check code quality and formatting with ESLint and Prettier, as defined in
**package.json**:

```shell
npm run check
```

## Philosophy

This UI's purpose is to provide an environment where, once the cluster is up,
you can immediately execute queries and explore data sets. The intended use
cases are:

* Initial proof-of-concept queries.
* Exploration of data sets.
* Performance analysis.
* Ad hoc query execution.
* Quickly enabling a data engineering team to start work before other
  integrations are in place.
* Early demos.

The approach:

1. Direct integration with the Athena backend
    - Auth via proxy (`X-Email`) and a dedicated `/api` service
    - Athena does the heavy lifting
2. Remove friction so you can simply write a query
    - Autocomplete understands the Trino/Presto-style SQL used by Athena
    - Provides syntax highlighting and validation
    - Offers a comprehensive catalog explorer
3. Avoid black-box query execution
    - Show progress and execution details. People ask "why is my query slow?"
      mostly because they only see a spinner for minutes.
4. Keep the experience easy to navigate

### Gaps and future direction

* Saving queries and using source control require backend storage or external
  systems (for example PostgreSQL).
* No autocomplete for the Athena function list.
* Basic graphing capabilities are still missing—looking at a table alone is
  not enough even for inspecting data sets.
* No LLM copilot integration yet. Many query UIs implement this poorly, but,
  done well, it could make query crafting fast and help translate from other
  query languages.
* Parameters and string replacement are only partly implemented in
  `SubstitutionEditor` and should support both SQL parameters and string
  replacement.

## Docker & GHCR

A single production image packages the backend and built frontend assets.

### Build locally

```bash
docker build -t athena-query-editor:local .
```

### Run locally

```bash
docker run --rm -p 8081:8081 \
  -e AWS_REGION=ap-east-1 \
  -e ATHENA_WORKGROUP=primary \
  -e ATHENA_OUTPUT_LOCATION=s3://your-bucket/path/ \
  -e DATABASE_URL=postgresql://postgres:postgres@host.docker.internal:5432/athena_query \
  athena-query-editor:local
```

### GHCR images

Images are published to:

```
ghcr.io/athena-query-labs/athena-query-editor
```

Tag rules:
- `latest` on pushes to `main`
- `vX.Y.Z` on GitHub release tags
Arm64 builds use GitHub-hosted `ubuntu-24.04-arm` runners.

### Kubernetes notes

- The container listens on port `8081`.
- Set required env vars: `AWS_REGION`, `ATHENA_WORKGROUP`, `ATHENA_OUTPUT_LOCATION`, `DATABASE_URL`.
- Mount or bake `config/athena-pricing.json` if you customize pricing.

Example deployment:

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: athena-query-editor
spec:
  replicas: 1
  selector:
    matchLabels:
      app: athena-query-editor
  template:
    metadata:
      labels:
        app: athena-query-editor
    spec:
      containers:
        - name: athena-query-editor
          image: ghcr.io/athena-query-labs/athena-query-editor:latest
          ports:
            - containerPort: 8081
          env:
            - name: AWS_REGION
              value: ap-east-1
            - name: ATHENA_WORKGROUP
              value: primary
            - name: ATHENA_OUTPUT_LOCATION
              value: s3://your-bucket/path/
            - name: DATABASE_URL
              value: postgresql://postgres:postgres@postgres.default.svc.cluster.local:5432/athena_query
---
apiVersion: v1
kind: Service
metadata:
  name: athena-query-editor
spec:
  selector:
    app: athena-query-editor
  ports:
    - port: 8081
      targetPort: 8081
  type: ClusterIP
```

### Multi-arch build verification

```bash
docker buildx imagetools inspect ghcr.io/athena-query-labs/athena-query-editor:latest
```
