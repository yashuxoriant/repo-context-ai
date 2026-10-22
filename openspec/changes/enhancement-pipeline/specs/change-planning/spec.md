# Spec Delta

## Purpose

Produces a grounded implementation plan for an intake ticket, using the
target repository's APPROVED context file and current scanned state as its
only inputs, and explicitly refuses to proceed when the ticket's acceptance
criteria are too ambiguous to scope safely.

## ADDED Requirements

### Requirement: Planning requires an approved repository context
The pipeline SHALL only plan a change against a repository whose context
file (see `context-generator` capability) is currently APPROVED, and SHALL
refuse to plan against a repository that has no approved context or only a
DRAFT one.

#### Scenario: Target repository has approved context
- **WHEN** change-planning runs against a repository whose context file
  status is APPROVED
- **THEN** planning proceeds using that context as grounding

#### Scenario: Target repository has no approved context
- **WHEN** change-planning runs against a repository with no context file or
  only a DRAFT one
- **THEN** planning refuses to proceed and reports the repository as not
  yet eligible for automated change planning

### Requirement: Ambiguity halts planning instead of guessing
The pipeline SHALL evaluate whether the ticket's acceptance criteria are
sufficient to scope a change unambiguously, and SHALL halt before producing
an implementation plan when they are not, rather than proceeding on an
assumption.

#### Scenario: Acceptance criteria are sufficient
- **WHEN** a ticket's acceptance criteria clearly describe the expected
  behavior change
- **THEN** planning produces an implementation plan grounded in those
  criteria and the repository's approved context

#### Scenario: Acceptance criteria are missing or ambiguous
- **WHEN** a ticket has no acceptance criteria, or criteria too vague to
  scope a change unambiguously
- **THEN** planning halts without producing an implementation plan, and
  flags the ticket for the clarifying-questions path (see
  `change-review-pipeline` capability)

### Requirement: Plan scope is bounded to the ticket's linked repository
The pipeline SHALL scope the implementation plan only to the repository (or
repositories) resolved during intake, and SHALL NOT include changes to any
other repository, even if the plan's author believes another repository is
related.

#### Scenario: Plan stays within the linked repository
- **WHEN** a plan is produced for a ticket linked to one repository
- **THEN** every planned file change in that plan is located within that
  repository
