# Swarm Runtime State & Stall Runbook

Authoritative specifications for `.swarm/` runtime state files, single-writer file ownership locks, and stall detection protocols.

---

## 1. Authoritative State Schema (`.swarm/state.json`)
The `.swarm/state.json` file is managed exclusively by `@dispatcher`. It acts as the single source of truth for task progress and file locks:

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

- **File Leases:** Exactly one active writer per file at any moment (`lease_status: "active"`). Critics and QA hold read-only leases.
- **Lease Revocation:** When an agent stalls, `@dispatcher` marks `lease_status: "revoked"` before reassigning ownership.

---

## 2. Deferred Findings Log (`.swarm/followups.md`)
Append-only log for deferred non-blocking items (`MEDIUM` and `LOW` severity). Each entry records:
- `TASK_ID` and timestamp
- Target file path and line reference
- Reporting critic role
- Actionable description and proposed remediation

---

## 3. Metrics Log (`.swarm/metrics.jsonl`)
Append-only JSON Lines telemetry log supporting two record types:
- `{"record_type": "agent_run", "agent": "backend-dev", "duration_seconds": 180, "tests_status": "passed", "stall_count": 0, "fallback_used": false}`
- `{"record_type": "task_summary", "task_id": "TASK-001", "tier": "tier_1", "duration_seconds": 720, "status": "completed", "tests_status": "passed", "review_rounds": 1, "stall_count": 0, "fallback_count": 0}`

---

## 4. Intelligent Stall Detection & Safe Reassignment
1. **Activity Monitoring:** `@monitor` tracks the latest turn and heartbeat of active agents.
2. **First Detection (3 minutes):** After 3 minutes of inactivity without a progress card or heartbeat, `@monitor` pings the agent with the exact `TASK_ID`.
3. **Second Detection & Escalation (5 minutes total):** After waiting 2 additional minutes without response, `@monitor` reports the stall to `@dispatcher`.
4. **Safe Reassignment Protocol:**
   - Confirm previous worker is stopped or detached.
   - Update `.swarm/state.json` setting `lease_status: "revoked"`.
   - Restore clean state via `git checkout` or rollback patch.
   - Grant explicit active lease to fallback agent.
   - Never spawn duplicate concurrent writers on an unconfirmed process.
5. **Critic Timeout Rules:**
   - **Tier 0:** Author self-verifies; no critic delay possible.
   - **Tier 1:** If critic budget expires without blockers detected, proceed with `UNREVIEWED` marker.
   - **Tier 2:** Tasks touching auth, payments, security, or migrations **NEVER** proceed unreviewed. If critic stalls, `@dispatcher` hot-swaps to fallback critic immediately.
