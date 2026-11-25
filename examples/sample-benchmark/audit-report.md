# Sample Evidence-Based Audit Report (Harness Verification Fixture)

## Measured Scorecard (Gate-Derived Only)

| Gate | Command | Result | Notes |
|---|---|---|---|
| **Smoke Suite** | `bash scripts/smoke-test.sh` | PASS (exit code 0) | 9/9 checks passed |
| **Report Verifier Tests** | `node scripts/verify-report.test.cjs` | PASS (exit code 0) | 7/7 fixture tests passed |
| **Runtime CLI Tests** | `node --test scripts/swarm-cli.test.cjs` | PASS (exit code 0) | 4/4 test cases passed |
| **Lint / Typecheck / Axe / Dep Audit** | N/A (zero-dep Node/Bash harness) | NOT APPLICABLE | No external npm deps or browser DOM |
| **Mutation Score** | N/A | NOT MEASURED | No mutation testing tool run |

- **Open P0 Blockers:** `0` (score cap not triggered)

---

## Findings

### AUDIT-001: Enforce deterministic max-files limit in atomic lease acquisition
- **id**: AUDIT-001
- **severity**: P2
- **file:line**: [scripts/swarm-cli.cjs:12](scripts/swarm-cli.cjs#L12)
- **evidence**: Command output: `node --test scripts/swarm-cli.test.cjs` verified `MAX_FILES_PER_TASK = 5` rejects 6-file lease acquisition with exit code 1 (`ok 2 - lock acquire, conflict rejection, max-5-files rejection`).
- **confidence**: verified
- **intent_check**: product_decision_needed
- **proposed_fix**: Retain `MAX_FILES_PER_TASK = 5` as an intentional scope-bounding invariant; if larger refactors arise, split them into multiple sequential tasks or expose a `config/swarm.config.yaml` override flag as an explicit product decision.
- **fix_tier**: 0
- **regression_test**: scripts/swarm-cli.test.cjs

### AUDIT-002: Verify dynamic critic routing for standard execution mode
- **id**: AUDIT-002
- **severity**: P2
- **file:line**: [config/swarm.config.yaml:18](config/swarm.config.yaml#L18)
- **evidence**: Command output: `bash scripts/smoke-test.sh` Check 7 confirmed `standard` mode defines `dynamic_critic` (`backend-critic` / `frontend-critic`) aligned with `tier_1` `critic_required: true`.
- **confidence**: verified
- **intent_check**: bug
- **proposed_fix**: Keep `standard` mode bound to `dynamic_critic` selection by changed file paths and validate mode parity in CI on every PR.
- **fix_tier**: 1
- **regression_test**: scripts/smoke-test.sh

### AUDIT-003: Delegate runtime state and stall detection to CLI
- **id**: AUDIT-003
- **severity**: P3
- **file:line**: [rules/swarm-orchestration.md:67](rules/swarm-orchestration.md#L67)
- **evidence**: Command output: `node --test scripts/swarm-cli.test.cjs` confirmed `check-stalls` exits with code 2 when active task `updated_at` exceeds 3m/5m thresholds (`ok 4 - check-stalls detects warn at 3m and escalate at 5m`).
- **confidence**: verified
- **intent_check**: product_decision_needed
- **proposed_fix**: Continue enforcing CLI-based state mutations via `scripts/swarm-cli.cjs`; evaluate adding optional `--json` flag to `status` in future iterations if automated dashboards consume it.
- **fix_tier**: 0
- **regression_test**: scripts/swarm-cli.test.cjs
