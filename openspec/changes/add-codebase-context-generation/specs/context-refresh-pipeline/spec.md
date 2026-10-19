# Spec Delta

## Purpose

Keeps generated context files current by detecting meaningful repository change,
re-running scanning and generation, and routing every result through mandatory human
review so the pipeline never silently changes what engineers and AI tools trust.

## ADDED Requirements

### Requirement: Change-triggered and scheduled regeneration
The pipeline SHALL trigger regeneration when a change to a configured set of significant
paths (for example manifest files, CI configuration, or README) lands on the default
branch, on a recurring schedule, and on manual request; it SHALL NOT trigger regeneration
on every commit.

#### Scenario: Significant change triggers regeneration
- **WHEN** a commit on the default branch modifies a configured significant path
- **THEN** the pipeline runs a new scan and generation pass for that repository

#### Scenario: Unrelated commit does not trigger regeneration
- **WHEN** a commit on the default branch modifies only files outside the configured
  significant paths
- **THEN** the pipeline does not trigger a regeneration run for that commit

#### Scenario: Scheduled run catches undetected drift
- **WHEN** the configured recurring schedule elapses regardless of recent commit activity
- **THEN** the pipeline runs a scan and generation pass for the repository

### Requirement: Mandatory human review before adoption
The pipeline SHALL submit every generated or regenerated context file as a pull request
and SHALL NOT merge any such pull request automatically; a context file only becomes
approved context once a human reviewer merges it.

#### Scenario: Generated update opens a review pull request
- **WHEN** regeneration produces a context file that differs from the currently approved
  version
- **THEN** the pipeline opens a pull request containing the proposed update and does not
  merge it

#### Scenario: No pull request is opened when there is no meaningful difference
- **WHEN** regeneration produces a context file whose only difference from the currently
  approved version is the generation timestamp or source commit SHA
- **THEN** the pipeline does not open a new pull request

### Requirement: Status transition on approval
The pipeline SHALL update a context file's status from draft to approved only as a result
of its review pull request being merged, and SHALL record the approving commit.

#### Scenario: Merge marks the context file approved
- **WHEN** a reviewer merges a context file's pull request
- **THEN** the merged file's status reads approved and references the merge commit
