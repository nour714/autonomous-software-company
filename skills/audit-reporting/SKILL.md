---
name: audit-reporting
description: Evidence-based audit reporting with gate-derived scorecards, intent checks, and strict findings validation.
metadata:
  icon: assessment
---

# Evidence-Based Audit Reporting

Operational protocol for generating reproducible, empirical audit reports backed by concrete test evidence.

## Required Finding Schema
Every audit finding must include all 9 required schema fields detailed in [Finding Schema](references/finding-schema.md):
- `id`: Unique identifier (e.g., `FIND-001`, `SEC-001`).
- `severity`: Gate severity (`P0`, `P1`, `P2`, `P3`).
- `file:line`: Repository-relative path and line number (never `file:///` or absolute drive path).
- `evidence`: Command execution output or verifiable reproduction steps.
- `confidence`: `verified` or `inferred`. An `inferred` finding cannot be P0/P1 without reproduction steps in evidence.
- `intent_check`: `bug` or `product_decision_needed`.
- `proposed_fix`: Specific, actionable remediation.
- `fix_tier`: Complexity tier (`0`, `1`, or `2`).
- `regression_test`: Automated test that fails before the patch and passes after.

Validate reports via `scripts/verify-report.sh <report.md> <project_root>`.
