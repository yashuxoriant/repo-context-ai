# Spec Delta

## Purpose

Writes the code change and corresponding tests on a feature branch strictly
within the boundaries of an approved plan, and enforces a pre-PR safety gate
so nothing reaches review without first passing the repository's own
existing checks.

## ADDED Requirements

### Requirement: Implementation stays within the approved plan's scope
The pipeline SHALL only modify files identified in the implementation plan
produced by `change-planning`, and SHALL NOT modify files outside that scope
even if doing so appears to improve the result.

#### Scenario: Implementation touches only planned files
- **WHEN** implementation runs against an approved plan listing specific
  files to change
- **THEN** the resulting diff touches only those files (plus any new test
  files the plan calls for)

### Requirement: Tests are written alongside the implementation
The pipeline SHALL produce or update test cases covering the planned
behavior change as part of the same implementation step, not as a separate,
optional follow-up.

#### Scenario: Implementation includes corresponding tests
- **WHEN** implementation completes for a plan describing a behavior change
- **THEN** the resulting branch includes test cases exercising that
  behavior change

### Requirement: Pre-PR safety gate
The pipeline SHALL run the target repository's existing test suite and lint
configuration against the implementation branch, and SHALL NOT proceed to
open a pull request if either fails.

#### Scenario: Safety gate passes
- **WHEN** the implementation branch passes the repository's existing test
  suite and lint
- **THEN** the pipeline proceeds to `change-review-pipeline`

#### Scenario: Safety gate fails
- **WHEN** the implementation branch fails the repository's existing test
  suite or lint
- **THEN** the pipeline does not open a pull request and instead reports
  the failure for human follow-up

### Requirement: AI-authored tests require explicit human review
The pipeline SHALL flag, within the pull request it eventually opens, which
test files were authored or modified by this capability, so a reviewer
explicitly reviews those tests rather than trusting them solely because they
pass.

#### Scenario: Pull request flags AI-authored tests
- **WHEN** a pull request is opened for an implementation that included new
  or modified test files
- **THEN** the pull request description explicitly lists those test files as
  requiring review, separate from the general code review
