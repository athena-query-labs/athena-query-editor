## Context
- Current repo builds frontend and backend separately, without a production container image.
- Need a single image for Kubernetes deployment that bundles both services.
- GitHub Actions should publish multi-arch images to GHCR; arm64 must be built on native ARM runners (no QEMU).
- Workflow can reference chatgpt-web build pipeline structure as a baseline.

## Goals / Non-Goals

**Goals:**
- Provide a production Docker image that serves the frontend and backend in one container.
- Support multi-arch (amd64 + arm64) image publishing to GHCR via GitHub Actions.
- Use native ARM runners for arm64 image build and push.
- Document required environment variables, tags, and k8s deployment notes.

**Non-Goals:**
- Split frontend and backend into separate images.
- Add Helm charts or k8s manifests beyond basic guidance.
- Introduce QEMU-based cross-builds for arm64.

## Decisions
- **Single-container deployment**: Bundle frontend static assets and backend server into one image to simplify k8s deployment (fewer services). Alternative: multi-container pod (rejected for higher operational complexity).
- **Multi-stage Docker build**: Use a build stage to compile frontend and backend, then copy artifacts into a slim runtime stage. Alternative: single-stage build (rejected for larger images).
- **Serve frontend from backend**: Backend will serve built frontend assets (existing pattern in repo), avoiding a separate web server. Alternative: add nginx (rejected for extra config and maintenance).
- **GH Actions workflow**: Use separate jobs for amd64 and arm64 builds, then create a multi-arch manifest pointing to both. Native ARM build uses GitHub-hosted `ubuntu-24.04-arm` runners (required). Alternative: QEMU (rejected by requirement).
- **Tag strategy**: Publish `latest`, and `sha-<short>` or `<git-sha>` tags on pushes; optionally `vX.Y.Z` on releases. Keep consistent for both architectures. Alternative: branch-only tags (rejected for weaker traceability).

## Risks / Trade-offs
- **[Risk] Native ARM runner availability** → Mitigation: document required runner selection and provide fallback instructions.
- **[Risk] Larger image size** → Mitigation: multi-stage build and prune dev dependencies.
- **[Risk] Runtime env mismatch** → Mitigation: make runtime env explicit via `ENV`/docs and validate on k8s.

## Migration Plan
- Add Dockerfile and `.dockerignore`.
- Add GitHub Actions workflow for build/push and manifest creation.
- Add docs for GHCR usage, image tags, and k8s deployment hints.
- Validate by pulling amd64/arm64 images and running in a test k8s cluster.

## Open Questions
- Are there any constraints or limits on using GitHub-hosted `ubuntu-24.04-arm` runners?
- Which tags do you want published by default (e.g., `latest`, `sha`, `semver`)?
- Should we support separate dev/prod Docker targets, or only production?
