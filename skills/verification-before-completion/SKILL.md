---
name: verification-before-completion
description: >-
  Empirical verification protocol requiring real execution evidence, exit code validation,
  and diff inspection before claiming completion.
metadata:
  icon: verified
---

# Verification Before Completion

Enforces empirical proof before any task or release is declared complete. Evidence precedes assertion.

## Triggering Conditions
- Completing a task, user story, bug fix, or refactoring step.
- Preparing release sign-off by `release-gatekeeper` or peer handoff.
- Prior to creating git commits, PRs, or marking tasks as done.

## Operational Checklist
- [ ] Execute build and test commands locally (`npm test`, `pytest`, `cargo test`, build scripts).
- [ ] Verify that commands exit with code 0 and capture actual stdout/stderr.
- [ ] Inspect full `git diff` to confirm only intended changes are staged.
- [ ] Check for unhandled edge cases, security regressions, and broken references.
- [ ] Explicitly list any unverified requirements or platform limitations with `TODO(verify)`.

## Execution Rules
1. **Evidence Precedes Claims:** Never state "tests pass" or "build succeeded" without pasting actual terminal output and exit code evidence.
2. **Zero Fabrication:** Never invent benchmark numbers, mock test results as real executions, or assume success from exit code absence.
3. **Diff Hygiene:** Ensure no stray debug logs, commented code, temporary artifacts, or unintended files exist in `git status`.
4. **Exit Code Verification:** An unverified command or an ignored error flag invalidates the completion claim.
5. **Honest Boundary Reporting:** When runtime limitations prevent local execution, explicitly document the limitation instead of claiming verification.
