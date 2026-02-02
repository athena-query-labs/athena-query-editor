# ADR-0008: Format query metrics and estimate cost in the API

- Status: Accepted
- Date: 2026-02-02

## Context / Problem Statement

The UI needs human-readable query metrics (queue time, execution time, scanned size) and a consistent estimated cost. Raw Athena metrics are returned in milliseconds and bytes, and cost depends on region-specific pricing.

## Decision

Normalize metrics in the API response: time values are returned in seconds with two decimals, scanned size is returned in GB with two decimals, and estimated cost is computed from region pricing configuration. If no scan data is available, cost is omitted.

## Key Drivers

- Keep the UI presentation simple and consistent.
- Avoid duplicating metric conversion logic in the frontend.
- Allow region-specific pricing overrides.

## Alternatives Considered

### Return raw metrics and let the UI format
- Duplicates formatting logic and risks inconsistent display.

### Hard-code pricing per region in the UI
- Makes pricing updates harder and spreads pricing logic across layers.

## Consequences

Positive:
- Single source of truth for metric formatting and cost estimation.
- Easier to update pricing configuration centrally.

Negative:
- API contract is more opinionated about presentation formats.

## Related Implementation and Constraints

- Metric formatting and cost: `server/src/pricing.ts`
- Query status response: `server/src/routes/query.ts`
- Pricing configuration: `server/src/config.ts`

