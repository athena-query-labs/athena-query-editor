# ADR-0009: Cap UI result rendering at 10,000 rows

- Status: Accepted
- Date: 2026-02-02

## Context / Problem Statement

Large result sets can overwhelm the browser and degrade the query editor experience. The UI should remain responsive even when queries return many rows.

## Decision

Limit results fetched and rendered in the UI to a maximum of 10,000 rows. The UI requests 100 rows per page from the API and stops once the cap is reached, with a user-facing warning that results were trimmed.

## Key Drivers

- Preserve UI responsiveness.
- Avoid excessive memory usage in the browser.
- Keep API usage predictable during result fetches.

## Alternatives Considered

### Render all rows
- Risks slow rendering and browser instability.

### Server-side pagination only
- Would require more UI complexity and state management.

## Consequences

Positive:
- Predictable performance for large queries.
- Clear UX signal when results are truncated.

Negative:
- Users cannot view beyond the 10,000-row cap in the UI.

## Related Implementation and Constraints

- UI result fetching, cap enforcement, and user-facing trim warning: `precise/src/AsyncAthenaClient.tsx` (search for `maxRows`)
- Result rendering (display only, no cap logic): `precise/src/ResultSet.tsx`

