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

## Measured Scorecard (Gate-Derived Only)
Readiness and security scores derive exclusively from objective tool gates; subjective percentages are forbidden:
- **Lint & Types**: 0 errors from linter (`eslint`) and typechecker (`tsc`).
- **Build & Tests**: Production build passes; automated test suite exits with code 0.
- **Accessibility & Security**: 0 critical/serious Axe violations; 0 high/critical dependency audit vulnerabilities.
- **P0 Score Capping**: Any open P0 finding caps overall readiness at 60 and security score at 70.
- **Mutation Score**: Must come from a real tool run (e.g. Stryker); otherwise reported as `"NOT MEASURED"`. Hand-picked mutants may be listed but never labeled as a mutation score.

## Intent Check Protocol
Before classifying any finding as a `bug`:
1. Inspect `git blame`, recent `git log`, and relevant ADRs for the target lines.
2. If the behavior was deliberate or intentional, classify as `intent_check: product_decision_needed`.
3. Provide constructive options and trade-offs instead of reflexively recommending removal.


