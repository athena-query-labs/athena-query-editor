## 1. Docker Packaging

- [x] 1.1 Add production Dockerfile (multi-stage) that builds frontend and backend
- [x] 1.2 Add .dockerignore to reduce build context size
- [x] 1.3 Ensure runtime image serves frontend assets and starts backend correctly
- [x] 1.4 Validate runtime configuration via environment variables

## 2. GHCR Multi-Arch Release Workflow

- [x] 2.1 Add GitHub Actions workflow for amd64 build/push to GHCR
- [x] 2.2 Add GitHub Actions job for native arm64 build/push (self-hosted ARM runner)
- [x] 2.3 Publish multi-arch manifest combining amd64 and arm64 images
- [x] 2.4 Implement tag strategy (latest + commit/semver tags)

## 3. Documentation & Verification

- [x] 3.1 Document image usage, required env vars, and k8s deployment notes
- [x] 3.2 Document GHCR publishing requirements and runner labels
- [x] 3.3 Add build/pull verification steps for amd64 and arm64 images
