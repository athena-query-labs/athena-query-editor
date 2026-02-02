# Athena Backend Integration

## Purpose
Define how the backend executes Athena queries and exposes results to the UI.

## Requirements

### Requirement: Execute Athena query
The system SHALL execute SQL queries using AWS Athena and return a query execution id.

#### Scenario: Successful query submission
- **WHEN** a user submits a SQL query
- **THEN** the system starts an Athena query and returns a query execution id linked to the user session

### Requirement: Poll Athena query status
The system SHALL poll Athena query execution status every 1 second until it reaches a terminal state or times out after 24 hours.

#### Scenario: Query completes successfully
- **WHEN** the system polls Athena for a running query
- **THEN** the system reports status as running until Athena returns SUCCEEDED

#### Scenario: Query fails
- **WHEN** Athena returns FAILED for a query execution id
- **THEN** the system reports status as failed and includes the Athena error message

#### Scenario: Query is cancelled
- **WHEN** Athena returns CANCELLED for a query execution id
- **THEN** the system reports status as cancelled

#### Scenario: Query times out
- **WHEN** a query has been polled for 24 hours without reaching a terminal state
- **THEN** the system cancels the Athena query and returns a timeout status

### Requirement: Expose query execution statistics
The system SHALL expose Athena query execution statistics to the UI throughout the query lifecycle, including scanned data size, execution time, queue time, and estimated cost.

#### Scenario: Statistics shown after completion
- **WHEN** a query execution reaches SUCCEEDED
- **THEN** the system returns scanned bytes, engine execution time, queue time, and estimated cost

#### Scenario: Statistics shown during execution
- **WHEN** a query execution is RUNNING or QUEUED
- **THEN** the system returns queue time and updates execution time, scanned bytes, and estimated cost as they become available

### Requirement: Format statistics for UI
The system SHALL provide time values in seconds with two decimal places and scanned data size in gigabytes with two decimal places.

#### Scenario: Format execution time
- **WHEN** the system returns execution time
- **THEN** it is formatted in seconds with two decimal places

#### Scenario: Format scanned size
- **WHEN** the system returns scanned data size
- **THEN** it is formatted in gigabytes with two decimal places

### Requirement: Estimate cost by region
The system SHALL estimate query cost using region-based pricing configuration and scanned data size.

#### Scenario: Estimate cost
- **WHEN** scanned data size is available
- **THEN** the system computes estimated cost using the configured price for the query region

### Requirement: Fetch Athena query results
The system SHALL retrieve query results from Athena and provide paginated rows to the UI with a default page size of 100 and a maximum page size of 1000.

#### Scenario: Fetch first page of results
- **WHEN** a query execution reaches SUCCEEDED
- **THEN** the system returns the first page of rows and the column metadata

#### Scenario: Fetch subsequent pages
- **WHEN** the UI requests the next page using a pagination token
- **THEN** the system returns the next page of rows and a new pagination token when available

### Requirement: Download full result file
The system SHALL provide a full-result download for the Athena query output file stored in S3 via a presigned URL with 24 hour expiration, and allow regeneration on demand.

#### Scenario: Request download for succeeded query
- **WHEN** a query execution reaches SUCCEEDED and the user clicks the download button
- **THEN** the system returns a presigned URL for the full S3 result file download

#### Scenario: Regenerate download URL
- **WHEN** a user requests download again
- **THEN** the system generates a new presigned URL

#### Scenario: Download filename uses query id
- **WHEN** a presigned URL is generated
- **THEN** the download filename is based on the Athena query execution id

### Requirement: Handle partial results for failed or cancelled queries
The system SHALL allow downloading partial results if Athena has already written a partial S3 result file for a failed or cancelled query, and SHALL label the download as partial.

#### Scenario: Partial results available after cancellation
- **WHEN** a query is CANCELLED and a result file exists in the output location
- **THEN** the system returns a presigned URL and marks the download as partial

#### Scenario: No result file available
- **WHEN** a query is FAILED or CANCELLED and no result file exists
- **THEN** the system returns a response indicating no downloadable result is available

### Requirement: Cancel Athena query
The system SHALL allow a user to cancel a queued or running Athena query.

#### Scenario: Cancel running query
- **WHEN** a user requests cancellation for a running query
- **THEN** the system requests Athena to stop the query and reports the status as cancelled

#### Scenario: Cancel queued query
- **WHEN** a user requests cancellation for a queued query
- **THEN** the system requests Athena to stop the query and reports the status as cancelled

### Requirement: Map Athena errors to UI errors
The system SHALL map Athena errors to user-visible error messages with the Athena error details preserved.

#### Scenario: Permission error
- **WHEN** Athena returns an access denied error
- **THEN** the system reports a permission error with the Athena error message included

### Requirement: Browse Athena metadata
The system SHALL expose Athena metadata browsing for catalogs, databases, tables, and columns.

#### Scenario: List databases
- **WHEN** the UI requests databases for the default catalog
- **THEN** the system returns the database list from Athena metadata APIs

#### Scenario: List tables
- **WHEN** the UI requests tables for a database
- **THEN** the system returns the table list from Athena metadata APIs

#### Scenario: Describe table
- **WHEN** the UI requests table schema details
- **THEN** the system returns column names and types from Athena metadata APIs
