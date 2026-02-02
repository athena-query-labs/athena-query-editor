## Why
Need a single deployable container that bundles frontend and backend, supports Kubernetes deployment, and ships multi-architecture images (x86_64 + arm64) via GitHub Actions and GHCR.

## What Changes
- Add a production Docker build that packages frontend and backend into one image for k8s deployment.
- Add multi-arch image publishing to GHCR via GitHub Actions.
- Use a native ARM runner for arm64 builds (no QEMU emulation).
- Document build/publish requirements and image tags.

## Capabilities

### New Capabilities
- `docker-packaging`: Build a production Docker image containing both frontend and backend, suitable for k8s.
- `multiarch-release`: Publish multi-architecture images (amd64/arm64) to GHCR via GitHub Actions, with native ARM build.

### Modified Capabilities
- (none)

## Impact
- New Dockerfile and container runtime config.
- New GitHub Actions workflow for multi-arch builds and GHCR publishing.
- Potential updates to README/deploy docs for k8s usage and image pull.
