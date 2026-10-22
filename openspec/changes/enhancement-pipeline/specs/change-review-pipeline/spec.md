# Spec Delta

## Purpose

Opens a pull request linking the originating ticket to the implemented
change, never merges it automatically, syncs ticket status as the change
progresses, and provides the clarifying-questions path for tickets that
`change-planning` halted on due to ambiguity.

## ADDED Requirements

### Requirement: Pull request links back to the originating ticket
The pipeline SHALL open a pull request that references the originating Jira
ticket, summarizes the change, and includes the pre-PR safety gate's test
results.

#### Scenario: Pull request references its ticket
- **WHEN** an implementation passes the pre-PR safety gate
- **THEN** the opened pull request's description includes the ticket
  identifier and a summary of the change

### Requirement: Never auto-merges
The pipeline SHALL NOT merge any pull request it opens; merging requires an
explicit human action through the repository's normal review process,
identical to the guarantee already established by
`context-refresh-pipeline`.

#### Scenario: Pull request awaits human merge
- **WHEN** a pull request is opened by this pipeline
- **THEN** it remains open and unmerged until a human merges it through the
  normal pull request review flow

### Requirement: Clarifying-questions path for halted planning
The pipeline SHALL open a draft pull request (or equivalent ticket comment)
containing specific clarifying questions when `change-planning` halts due to
ambiguous or missing acceptance criteria, rather than silently dropping the
ticket.

#### Scenario: Ambiguous ticket produces a questions draft
- **WHEN** `change-planning` halts a ticket for insufficient acceptance
  criteria
- **THEN** the pipeline surfaces specific clarifying questions back on the
  ticket (or as a draft pull request) instead of taking no visible action

### Requirement: Ticket status sync reflects pipeline stage
The pipeline SHALL update the originating ticket's status as the change
progresses through at least: pull request opened, pull request merged, and
deployed to staging - and SHALL NOT mark a ticket as deployed to production
automatically.

#### Scenario: Ticket reflects PR opened
- **WHEN** a pull request is opened for a ticket
- **THEN** the ticket's status is updated to reflect that a pull request is
  open

#### Scenario: Ticket reflects merge and staging deployment
- **WHEN** the pull request is merged and the change is deployed to a
  staging environment
- **THEN** the ticket's status is updated accordingly

#### Scenario: Production deployment is never automatic
- **WHEN** a change has been deployed to staging
- **THEN** the pipeline does not deploy it to production and does not mark
  the ticket as production-deployed without a separate, explicit human
  approval step outside this pipeline's automatic flow
