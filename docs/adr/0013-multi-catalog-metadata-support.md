# ADR-0013: Multi-catalog metadata support on the server

- Status: Accepted
- Date: 2026-05-29

## Context / Problem Statement

The original `/api/metadata/catalogs` route returned a hardcoded one-element list `[config.defaultCatalog]` without calling Athena at all. Meanwhile `/databases`, `/tables`, and `/columns` accepted no `?catalog=` parameter and silently always queried `config.defaultCatalog`. This left customers using AWS Athena's federated catalogs (Glue + Lambda + Hive + cross-account) completely unable to browse anything outside the default catalog through this UI.

The Codex migration completeness review (REPORT.md finding #1) classified this as the most surprising "wrong-code stub" — the function signature suggests the work was done, but the implementation was a placeholder.

## Decision

Wire the four metadata routes through to real Athena calls and accept an optional `?catalog=<name>` query parameter on the three that need one:

- `GET /api/metadata/catalogs` — call `ListDataCatalogsCommand` (workgroup-scoped, paginated via `NextToken`). Return all catalogs visible to the configured workgroup, by name.
- `GET /api/metadata/databases?catalog=<name>` — call `ListDatabasesCommand` with the requested catalog; if omitted, fall back to `config.defaultCatalog` (backward-compatible).
- `GET /api/metadata/tables?catalog=<name>&database=<db>` — same pattern; `database` still required.
- `GET /api/metadata/columns?catalog=<name>&database=<db>&table=<t>` — same pattern.

This is server-side enablement only. The current frontend never passes `?catalog=`, so behaviour is unchanged for existing deploys with a single-catalog setup. UI work to actually let the user switch catalogs is tracked separately (see review's Wave 5).

## Key Drivers

- Don't ship a stub disguised as a real route.
- Unblock Lambda/Hive/federated-catalog users without forcing a frontend redesign in the same change.
- Stay backward-compatible: existing frontend calls without `?catalog=` keep working.

## Alternatives Considered

### Leave it as a stub and ship the frontend multi-catalog UI together
- Keeps the change cohesive but blocks server-side users (e.g., direct API consumers, scripted clients) from accessing federated catalogs in the meantime.
- Rejected — the server fix is small and independently useful.

### Make `?catalog=` required on `/databases`/`/tables`/`/columns`
- Tighter contract, but breaks all current frontend calls in one go.
- Rejected — make the parameter optional with a `config.defaultCatalog` fallback.

## Consequences

Positive:
- Multi-catalog deploys (Lambda/Hive federation, cross-account Glue) can now be enumerated through `/api/metadata/catalogs`.
- All four routes are real, no longer carrying a misleading stub.

Negative:
- **IAM permission additions required.** The service role now needs `athena:ListDataCatalogs` (in addition to `athena:ListDatabases` and the existing list). Operators with minimum-privilege roles will see 403 on `/catalogs` until they add it. Documented in `server/README.md` (Wave 4).
- Slight latency increase for `/catalogs` — it's now a real Athena call rather than an in-process return. Athena pagination kept on the server side; UI sees the same flat list.

## Related Implementation and Constraints

- Routes: `server/src/routes/metadata.ts`
- SDK additions: `ListDataCatalogsCommand` from `@aws-sdk/client-athena`.
- IAM doc: `server/README.md` IAM permissions section needs `athena:ListDataCatalogs`.
- Future work (out of scope for this ADR): frontend UI to switch catalogs (review's Wave 5 G-02/G-03), and surfacing each catalog's `Type` (`GLUE` / `LAMBDA` / `HIVE` / `FEDERATED`) so the UI can display appropriate icons.
