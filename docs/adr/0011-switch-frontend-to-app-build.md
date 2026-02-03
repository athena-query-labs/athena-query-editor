# ADR-0011: Switch frontend build to application output

- Status: Accepted
- Date: 2026-02-03

## Context / Problem Statement

The frontend `precise` package was configured as a Vite library build, which produces JS bundles but no `index.html`. For container deployment, the backend must serve a complete frontend application, and the Docker build requires a concrete `index.html` output.

## Decision

Switch the default Vite build for `precise` to an application build (remove `build.lib` configuration). This ensures `npm run build` generates `dist/index.html`, which the backend can serve in the single-container deployment.

## Key Drivers

- Container builds must fail if UI artifacts are missing.
- Simplify the build pipeline to a single app build path.
- Avoid maintaining separate library and app build configurations.

## Alternatives Considered

### Keep library build and add a second app build config
- Adds complexity and increases the chance of drift between builds.

### Serve a library bundle via a custom HTML template
- Requires extra tooling and still needs an `index.html` source of truth.

## Consequences

Positive:
- Docker builds can enforce presence of `index.html`.
- Runtime serving logic is straightforward (`express.static` + SPA fallback).

Negative:
- The package is no longer built as a reusable library by default.

## Related Implementation and Constraints

- Build configuration: `precise/vite.config.ts`
- Build command: `precise/package.json`
- Docker validation: `Dockerfile`
