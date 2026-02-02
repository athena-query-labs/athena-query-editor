## ADDED Requirements

### Requirement: Single production image bundles frontend and backend
The system SHALL provide a production Docker image that includes both the backend service and the built frontend assets.

#### Scenario: Build produces a runnable image
- **WHEN** a production Docker build is executed
- **THEN** it outputs an image that can start the backend and serve the frontend assets

### Requirement: Multi-stage build for production
The system SHALL use a multi-stage Docker build to produce a slim runtime image.

#### Scenario: Build artifacts are copied into runtime stage
- **WHEN** the Docker build completes
- **THEN** the runtime stage contains only production artifacts and runtime dependencies

### Requirement: K8s-compatible runtime configuration
The system SHALL allow runtime configuration via environment variables suitable for Kubernetes deployment.

#### Scenario: Runtime uses environment variables
- **WHEN** the container starts in a k8s environment
- **THEN** it reads required configuration from environment variables

### Requirement: Provide container startup command
The system SHALL define a container startup command that launches the backend and serves the frontend.

#### Scenario: Container starts successfully
- **WHEN** the container is run
- **THEN** the backend starts and the frontend is accessible from the same container
