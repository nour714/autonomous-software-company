# Finding Schema & Evidence-Based Audit Reporting Reference

Authoritative specification for findings, measured scorecards, intent checks, and report validation.

---

## 1. Mandatory Finding Schema Fields

Every finding recorded in an audit report MUST include all 9 required fields:

| Field | Type | Description & Constraints |
|---|---|---|
| `id` | string | Unique finding identifier (e.g., `FIND-001`, `SEC-001`, `A11Y-001`). |
| `severity` | enum | Gate severity: `P0` (critical blocker), `P1` (high), `P2` (medium), `P3` (low/informational). |
| `file:line` | string | Repository-relative path and line number (e.g. `src/auth.ts:42` or markdown file link). Never use `file:///` URLs or absolute drive paths. |
| `evidence` | string | Verifiable terminal command output or explicit step-by-step reproduction commands. |
| `confidence` | enum | `verified` (empirically reproduced) or `inferred` (deduced from code analysis).<br>**Constraint:** Inferred findings cannot be marked `P0` or `P1` without reproduction steps in evidence. |
| `intent_check` | enum | `bug` (unintended defect) or `product_decision_needed` (deliberate architectural or product choice). |
| `proposed_fix` | string | Specific, actionable patch or remediation steps. |
| `fix_tier` | enum | Complexity tier: `0` (docs, CSS, formatting), `1` (routine code fix), `2` (security, auth, DB migration, breaking change). |
| `regression_test` | string | Automated test file path or specific test case asserting that the issue fails before fix and passes after. |

---

## 2. Canonical Markdown Finding Format

Findings in audit reports (`report.md`) should follow this standard Markdown structure:

```markdown
### FIND-001: Missing token expiration validation
- **id**: FIND-001
- **severity**: P1
- **file:line**: src/auth/token.ts:42
- **evidence**: Repro steps: run `npm test tests/auth/token.test.ts` -> fails with `TokenValidationError: expired token accepted`
- **confidence**: verified
- **intent_check**: bug
- **proposed_fix**: Add expiration timestamp check (`payload.exp < Date.now() / 1000`) before decoding token claims.
- **fix_tier**: 1
- **regression_test**: tests/auth/token-expiration.test.ts
```

---

## 3. Measured Scorecard Specification

Audit reports must compute readiness and health scores derived **strictly and exclusively from automated tool gates**. Subjective percentages or heuristic scores are prohibited.

### Objective Gate Derivations

| Gate | Tool / Command | Pass Condition | Failure Impact |
|---|---|---|---|
| **Lint** | `npm run lint` / `eslint` | 0 errors | Score deduction based on error count |
| **Type Check** | `tsc --noEmit` / `mypy` | 0 type errors | Gates compilation |
| **Build** | `npm run build` | Exit code 0 | Blocks release if failed |
| **Unit/Integration Tests** | `npm test` / `pytest` | 100% passing (exit code 0) | Direct test pass percentage |
| **Accessibility (a11y)** | `axe-core` / `@axe-core/cli` | 0 critical/serious violations | Gates UI release |
| **Dependency Audit** | `npm audit` / `trivy` | 0 high/critical advisories | Gates security release |

### Hard Capping Rules
- **Overall Readiness Cap:** Any unresolved or open `P0` finding automatically caps the overall readiness score at a maximum of **60/100**, regardless of other passed gates.
- **Security Readiness Cap:** Any unresolved or open `P0` finding automatically caps the security score at a maximum of **70/100**.

### Mutation Testing Rules
- A mutation score must originate from a real tool execution (e.g. `stryker run`, `mutmut`).
- If no real mutation testing tool was executed, the mutation score must be reported explicitly as:
  `MUTATION SCORE: NOT MEASURED — TOOL EXECUTION UNAVAILABLE`
- Hand-picked or manually crafted mutants may be documented as illustrative test cases, but must **never** be labeled or aggregated as an overall mutation score.

---

## 4. Intent Check Protocol

Before classifying any code discrepancy as a `bug`:
1. **Historical Analysis:** Run `git blame <file>` and inspect `git log -S <symbol>` or commit messages for the target code.
2. **Architecture Decision Records:** Check `docs/adrs/` or `rules/references/` for documented rationale or design trade-offs.
3. **Classification:**
   - If the implementation is unintentional, incorrect, or contradicts the specification: mark `intent_check: bug`.
   - If the implementation appears intentional (e.g., deliberate fallback, deliberate backward-compatibility, resource limit mitigation): mark `intent_check: product_decision_needed`.
4. **Constructive Options:** When classifying as `product_decision_needed`, list clear architectural options and trade-offs rather than reflexively recommending "delete it" or "revert it".

---

## 5. Platform Limits Verification Rule

When making recommendations or finding notes related to cloud or runtime platform limitations:
- Check current official provider documentation for:
  - Cron frequency limits (e.g., Vercel Cron, Cloudflare Triggers).
  - Serverless function timeout durations (e.g., 10s vs 60s vs 300s).
  - Database connection pool maximums (e.g., Supabase / Neon connection pooling).
  - Plan-specific payload and memory boundaries.
- If live documentation access is unavailable, you **must**:
  1. Append `# TODO(verify)` to the parameter or assertion.
  2. Clearly state the underlying assumption in the finding evidence or proposed fix.

---

## 6. Automated Report Verification

All reports must pass automated validation with:
```bash
./scripts/verify-report.sh <report.md> <project_root>
```
The validator enforces:
1. All referenced files exist in `<project_root>`.
2. All referenced line numbers do not exceed file EOF.
3. Zero occurrences of `file:///` URIs or absolute drive paths.
4. Link text paths match link target paths.
5. All 9 required finding schema fields are present and valid.
6. Inferred findings do not claim P0 or P1 severity without reproduction steps.
