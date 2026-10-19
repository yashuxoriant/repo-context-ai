# Spec Delta

## Purpose

Produces the structured, redacted repository signals (structure, manifests, history,
config) that the context generator uses as its only source of truth, so generated
context stays grounded in real repository evidence rather than invented detail.

## ADDED Requirements

### Requirement: Structured repository signal extraction
The scanner SHALL extract, for a given target repository, a structured bundle containing:
the top-level directory tree (depth-limited, excluding build/dependency artifacts), the
README content, manifest file(s) relevant to the repository's language/framework, CI
configuration files, the N most frequently changed files over a configurable recent
period, and the N largest source files by line count.

#### Scenario: Scan produces a complete signal bundle
- **WHEN** the scanner runs against a repository that has a README, a manifest file, and
  at least one CI configuration file
- **THEN** the output bundle includes the directory tree, README content, manifest
  content, CI configuration content, a hot-files list, and a largest-files list

#### Scenario: Scan handles a repository missing optional inputs
- **WHEN** the scanner runs against a repository with no CI configuration present
- **THEN** the output bundle still includes the remaining available signals and marks
  the CI configuration field as not present, rather than failing

### Requirement: Secret and credential redaction
The scanner SHALL redact any line in any scanned file content that matches common
secret/credential patterns (including but not limited to API keys, passwords, private
keys, and tokens) before that content is included in the output bundle.

#### Scenario: Secret-like content is redacted before output
- **WHEN** a scanned file contains a line matching a secret/credential pattern
- **THEN** the corresponding line in the output bundle is replaced with a redaction
  marker and the original value does not appear anywhere in the scanner's output

#### Scenario: Files conventionally reserved for secrets are excluded entirely
- **WHEN** the scanner encounters a file matching common secret-file conventions (for
  example `.env`, `*.pem`, `*.key`) or a path excluded via `.gitignore` secret patterns
- **THEN** that file's content is excluded from the output bundle entirely, not merely
  redacted line-by-line

### Requirement: Repository access boundary enforcement
The scanner SHALL only run against a repository the invoking user or service identity
already has read access to, using the identity's existing repository permissions; it
SHALL NOT introduce a separate access or authorization mechanism.

#### Scenario: Scan is denied for an inaccessible repository
- **WHEN** a scan is requested for a repository the invoking identity does not have read
  access to
- **THEN** the scanner refuses to run and returns an access-denied result without
  producing any output bundle
