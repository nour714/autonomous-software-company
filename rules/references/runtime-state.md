# Swarm Runtime State & Stall Runbook

Authoritative specifications for `.swarm/` runtime state files, atomic file ownership locks, telemetry logging, and deterministic stall detection via `scripts/swarm-cli.cjs`.

---

## 1. Authoritative State & CLI Enforcement (`.swarm/state.json`)
Never hand-edit `.swarm/state.json` or `.swarm/metrics.jsonl`. `@dispatcher` and workers must invoke `node scripts/swarm-cli.cjs` for all state transitions, lease operations, and telemetry appends:

- **Initialize Workspace:** `node scripts/swarm-cli.cjs init [--dir <project-root>]`
- **Acquire Lease (Atomic, max 5 files):** `node scripts/swarm-cli.cjs lock acquire --task <TASK_ID> --owner <AGENT> --files <f1,f2,...> [--mode <mode>] [--tier <tier>]`
- **Check Lease:** `node scripts/swarm-cli.cjs lock check --file <path>`
- **Release Lease (Atomic):** `node scripts/swarm-cli.cjs lock release --task <TASK_ID> [--status <completed|failed|cancelled>]`
- **Inspect Active Leases:** `node scripts/swarm-cli.cjs status`

```json
{
  "schema_version": 1,
  "tasks": [
    {
      "task_id": "TASK-001",
      "mode": "standard",
      "tier": "tier_1",
      "owner": "backend-dev",
      "owned_files": ["server/routes/api.js"],
      "lease_status": "active",
      "status": "in_progress",
      "time_budget_minutes": 15,
      "review_rounds": 0,
      "dependencies": [],
      "started_at": "2026-11-13T12:00:00Z",
      "updated_at": "2026-11-13T12:05:00Z",
      "last_heartbeat_at": "2026-11-13T12:05:00Z"
    }
  ]
}
```

- **File Leases:** Exactly one active writer per file at any moment (`lease_status: "active"`). Critics and QA hold read-only access.
- **Lease Revocation:** On stall escalation, `@dispatcher` releases/revokes the active lease via `swarm-cli.cjs lock release --task <TASK_ID> --status failed` before reassigning ownership.

---

## 2. Deferred Findings Log (`.swarm/followups.md`)
Append-only log for deferred non-blocking items (`MEDIUM` and `LOW` severity). Each entry records:
- `TASK_ID` and timestamp
- Target file path and line reference
- Reporting critic role
- Actionable description and proposed remediation

---

## 3. Metrics Log (`.swarm/metrics.jsonl`)
Append-only JSON Lines telemetry log written via `swarm-cli.cjs log-metric`:
```bash
node scripts/swarm-cli.cjs log-metric --type <task_summary|agent_run|stall> --task <TASK_ID> --tier <tier_0|tier_1|tier_2> --status <pass|fail|stalled> --duration-ms <ms> [--agent <name>] [--tests-passed <n>] [--tests-failed <n>]
```
Analyze recorded metrics at any time using `bash scripts/swarm-report.sh`.

---

## 4. On-Demand Stall Detection & Safe Reassignment
1. **Deterministic Check:** `@dispatcher` runs `node scripts/swarm-cli.cjs check-stalls [--warn-min 3] [--escalate-min 5]` at orchestration checkpoints.
2. **Trigger Condition:** When `check-stalls` exits with code `0`, no stalls exist. When it exits with code `2`, invoke `@monitor` on demand with the emitted `{ warn, escalate }` payload.
3. **First Detection (`warn` >= 3 minutes):** `@monitor` sends a single awakening ping to the inactive agent with the exact `TASK_ID`.
4. **Escalation (`escalate` >= 5 minutes):** `@monitor` reports the confirmed stall to `@dispatcher` and logs a stall metric via `swarm-cli.cjs log-metric --type stall`.
5. **Safe Reassignment Protocol:**
   - Confirm previous worker is stopped or detached.
   - Release the stale lease via `node scripts/swarm-cli.cjs lock release --task <TASK_ID> --status failed`.
   - Restore clean state via `git checkout` or rollback patch.
   - Acquire an explicit new lease for the fallback agent via `swarm-cli.cjs lock acquire`.
   - Never spawn duplicate concurrent writers on an unconfirmed process.
6. **Critic Timeout Rules:**
   - **Tier 0:** Author self-verifies; no critic delay possible.
   - **Tier 1:** If critic budget expires without blockers detected, proceed with `UNREVIEWED` marker.
   - **Tier 2:** Tasks touching auth, payments, security, or migrations **NEVER** proceed unreviewed. If critic stalls, `@dispatcher` hot-swaps to fallback critic immediately.
