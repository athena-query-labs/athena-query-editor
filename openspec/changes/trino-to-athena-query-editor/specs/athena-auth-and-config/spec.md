## ADDED Requirements

### Requirement: Use AWS default credential chain
The system SHALL authenticate to Athena using the AWS SDK default credential provider chain.

#### Scenario: Credentials resolved from environment
- **WHEN** valid AWS credentials are available in the environment
- **THEN** the system uses those credentials to call Athena APIs

#### Scenario: Credentials resolved from instance role
- **WHEN** no static credentials are configured and the runtime has an instance role
- **THEN** the system uses the instance role credentials to call Athena APIs

### Requirement: User-level isolation
The system SHALL isolate Athena query executions by user identity provided via the `X-Email` header.

#### Scenario: User-scoped query list
- **WHEN** two users submit queries concurrently
- **THEN** each user only sees their own query executions and results

### Requirement: User identity transport
The system SHALL read user identity from the `X-Email` header injected by oauth2-proxy.

#### Scenario: Request with authenticated identity
- **WHEN** a request includes `X-Email`
- **THEN** the system uses it as the user identity for isolation and history

#### Scenario: Missing identity header
- **WHEN** a request does not include `X-Email`
- **THEN** the system rejects the request as unauthorized

### Requirement: Persist query history by user
The system SHALL persist query history per user and retain it long-term.

#### Scenario: History retained after cancellation
- **WHEN** a user cancels a query
- **THEN** the query remains in the session history with status cancelled

### Requirement: Query history schema
The system SHALL store query history with the following fields: user email, query execution id, SQL text, status, submitted time, completed time, error message (if any), scanned bytes, execution time, queue time, estimated cost, output location, workgroup, catalog, and database.

#### Scenario: Persist query fields
- **WHEN** a query record is written
- **THEN** all required fields are stored for later retrieval

### Requirement: Use PostgreSQL for query history storage
The system SHALL store user-scoped query history in PostgreSQL.

#### Scenario: Persist query record
- **WHEN** a query is submitted
- **THEN** the system writes a query record to PostgreSQL with user identity and execution identifiers

### Requirement: Required Athena configuration
The system SHALL require configuration for AWS region, Athena workgroup, and S3 query result output location.

#### Scenario: Missing required configuration
- **WHEN** the service starts without a required Athena configuration value
- **THEN** the system fails fast with an explicit configuration error

### Requirement: Region pricing configuration
The system SHALL load a region-to-price-per-TB mapping from a configuration file to estimate query cost.

#### Scenario: Missing region price
- **WHEN** a query runs in a region without a configured price
- **THEN** the system falls back to a default price and flags the estimate as approximate

### Requirement: Optional default catalog and database
The system SHALL allow configuration of default Athena catalog and database for new sessions.

#### Scenario: Use default database
- **WHEN** a session starts without a selected database
- **THEN** the system uses the configured default catalog and database

### Requirement: Allow database switching
The system SHALL allow users to switch the active database within the default catalog.

#### Scenario: Switch database
- **WHEN** a user selects a different database
- **THEN** subsequent queries and metadata browsing use the selected database

### Requirement: Default catalog only
The system SHALL expose metadata for the configured default catalog only.

#### Scenario: Catalog selection not available
- **WHEN** the UI requests metadata browsing
- **THEN** the system uses the configured default catalog without exposing catalog selection

### Requirement: No metadata permission filtering
The system SHALL not apply additional metadata permission filtering beyond AWS IAM permissions in this version.

#### Scenario: Return metadata as provided by Athena
- **WHEN** the system retrieves metadata from Athena
- **THEN** it returns the results without additional filtering

### Requirement: No Trino compatibility
The system SHALL operate with Athena as the only supported backend.

#### Scenario: Trino backend disabled
- **WHEN** the service is configured for Athena
- **THEN** Trino-specific backend selection or routes are unavailable
