# Spec Delta

## Purpose

Turns a repo-scanner signal bundle into the standardized, fixed-schema context file that
engineers and AI coding tools consume, grounding every statement in scanned evidence and
clearly flagging anything that cannot be confirmed from that evidence.

## ADDED Requirements

### Requirement: Fixed-schema context file generation
The generator SHALL produce a context file with exactly these sections, in this order:
Overview, Architecture, Setup & Local Dev, Key Modules / Directories, Coding Conventions,
Dependencies, Important Files, Known Constraints / Gotchas, Ownership, Last Validated.

#### Scenario: Generated file matches the fixed schema
- **WHEN** the generator produces a context file from a valid signal bundle
- **THEN** the output file contains all ten required sections in the specified order and
  no additional top-level sections

### Requirement: Evidence-grounded content only
The generator SHALL base every statement in the generated file only on content present in
the provided signal bundle, and SHALL explicitly mark any section where the available
evidence is insufficient rather than inferring unsupported detail.

#### Scenario: Insufficient evidence is marked, not invented
- **WHEN** the signal bundle contains no information relevant to a given section (for
  example, no CODEOWNERS or ownership metadata)
- **THEN** that section states that the information was not evident from available
  files and needs engineer input, instead of containing a fabricated answer

### Requirement: Draft status stamping until human approval
The generator SHALL mark every generated or regenerated context file as a draft, stamped
with the generation date and source commit SHA, until a human approves it; approval status
SHALL only change to approved as part of the review workflow, never by the generator itself.

#### Scenario: Newly generated file is stamped as draft
- **WHEN** the generator produces a context file for the first time or on refresh
- **THEN** the Last Validated section records the generation date, the source commit SHA,
  and a status of draft pending engineer review

### Requirement: Canonical output with tool-specific mirroring
The generator SHALL write one canonical context file per repository and SHALL mirror its
content, unmodified in substance, to the file paths that supported AI coding tools read
natively.

#### Scenario: Canonical file is mirrored to tool-specific paths
- **WHEN** the generator writes the canonical context file for a repository
- **THEN** the same content is also written to each configured tool-specific path (for
  example the GitHub Copilot instructions path) without content drift between copies
