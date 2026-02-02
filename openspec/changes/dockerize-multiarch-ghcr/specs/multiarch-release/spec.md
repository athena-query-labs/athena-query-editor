## ADDED Requirements

### Requirement: Publish multi-arch images to GHCR
The system SHALL publish multi-architecture Docker images (amd64 and arm64) to GHCR.

#### Scenario: Image is available for amd64
- **WHEN** the CI workflow completes
- **THEN** the GHCR image can be pulled for amd64

#### Scenario: Image is available for arm64
- **WHEN** the CI workflow completes
- **THEN** the GHCR image can be pulled for arm64

### Requirement: Use native ARM build runner
The system SHALL build the arm64 image on a native ARM runner (no QEMU emulation).

#### Scenario: ARM build uses native runner
- **WHEN** the workflow builds the arm64 image
- **THEN** it runs on a runner labeled for native ARM hardware

### Requirement: Create multi-arch manifest
The system SHALL publish a multi-arch manifest that references the amd64 and arm64 images.

#### Scenario: Manifest references both architectures
- **WHEN** the workflow publishes the manifest
- **THEN** it includes the amd64 and arm64 image digests

### Requirement: Tag images consistently
The system SHALL tag images consistently across architectures (e.g., latest and commit-based tags).

#### Scenario: Tag parity across architectures
- **WHEN** images are published
- **THEN** amd64 and arm64 images share the same tags
