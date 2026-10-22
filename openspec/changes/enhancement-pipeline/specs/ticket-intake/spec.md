# Spec Delta

## Purpose

Detects an eligible Jira story, extracts the information needed to scope a
change (description, acceptance criteria, linked docs), and determines which
onboarded repository or repositories it targets, so downstream planning
never has to re-derive this from raw ticket text itself.

## ADDED Requirements

### Requirement: Eligible ticket detection
The pipeline SHALL only act on a Jira story that is explicitly marked
eligible for automation (for example, via a dedicated label or a specific
workflow status), and SHALL ignore all other ticket activity.

#### Scenario: Eligible ticket triggers intake
- **WHEN** a story carrying the automation-eligible marker is created or
  transitions into the triggering status
- **THEN** the pipeline begins the intake process for that ticket

#### Scenario: Ineligible ticket is ignored
- **WHEN** a story without the automation-eligible marker changes
- **THEN** the pipeline takes no action for that ticket

### Requirement: Structured ticket extraction
The pipeline SHALL extract the ticket's title, description, acceptance
criteria, and any explicitly linked documentation, and SHALL represent
missing acceptance criteria as absent rather than inferring them from the
description.

#### Scenario: Ticket with explicit acceptance criteria
- **WHEN** an eligible ticket has a populated acceptance-criteria field
- **THEN** the extracted result includes those criteria verbatim

#### Scenario: Ticket missing acceptance criteria
- **WHEN** an eligible ticket has no acceptance-criteria field populated
- **THEN** the extracted result marks acceptance criteria as absent,
  which downstream planning must treat as insufficient to proceed safely

### Requirement: Target repository resolution limited to explicit links
The pipeline SHALL resolve the target repository or repositories for a
ticket only from fields/links explicitly present on the ticket (for example
a repository-link custom field), and SHALL NOT infer additional repositories
it believes may also be affected.

#### Scenario: Ticket links exactly one repository
- **WHEN** an eligible ticket has one repository explicitly linked
- **THEN** that repository is the sole target for downstream planning

#### Scenario: Ticket has no repository link
- **WHEN** an eligible ticket has no repository explicitly linked
- **THEN** intake marks the ticket as unresolved and does not proceed to
  planning, rather than guessing a target
