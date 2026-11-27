# Swarm Performance Benchmark Procedure & Metrics Schema

Repeatable benchmarking protocol for measuring multi-agent speedup, review round caps, fallback activations, and stall mitigation.

---

## 1. Structured Metrics Schema (`.swarm/metrics.jsonl`)

The `.swarm/metrics.jsonl` file records append-only JSON Lines with two distinct record schemas.

### 1.1 Task Summary Record (`"record_type": "task_summary"`)
Emitted by `@release-gatekeeper` or `@dispatcher` at task completion:
```json
{
  "record_type": "task_summary",
  "task_id": "TASK-001",
  "mode": "standard",
  "risk_tier": "tier_1",
  "duration_seconds": 640,
  "review_rounds": 1,
  "max_review_rounds_hit": false,
  "fallback_count": 0,
  "stall_count": 0,
  "status": "completed",
  "verdict": "approved",
  "tests_status": "passed",
  "timestamp": "2026-11-13T14:00:00Z"
}
```

### 1.2 Agent Run Record (`"record_type": "agent_run"`)
Emitted by each individual agent upon completing a turn:
```json
{
  "record_type": "agent_run",
  "task_id": "TASK-001",
  "agent": "backend-dev",
  "model_used": "builder_tier",
  "fallback_used": false,
  "duration_seconds": 185,
  "files_modified": 2,
  "tool_calls_count": 4,
  "timestamp": "2026-11-13T13:55:00Z"
}
```

*Note on Token/Cost Telemetry:* Token usage and API cost fields are recorded only when exposed directly by the underlying execution platform; synthetic or fabricated values are strictly forbidden.

---

## 2. Repeatable 3-Tier Benchmark Suite

To measure system efficiency under standardized conditions, run the following three benchmark tasks:

### Task 1: Tier 0 Fast-Lane Task (Documentation / Pure CSS)
- **Objective:** Update README badge and adjust responsive button margins in CSS.
- **Expected Mode:** Quick Mode (2 agents: Dispatcher $\rightarrow$ Frontend Dev $\rightarrow$ Self-verification).
- **Target Time Budget:** $\le 5$ minutes.
- **Critic Required:** None (Author verifies via `git diff`).
- **Success Criteria:** Zero critic overhead, task completed $\le 5$ minutes, exit code 0.

### Task 2: Tier 1 Standard Feature Task (REST Endpoint + UI)
- **Objective:** Implement a new read endpoint `/api/v1/health` with mock-backed frontend status card.
- **Expected Mode:** Standard Mode (Dispatcher $\rightarrow$ Architecture Contract Freeze $\rightarrow$ Parallel Devs $\rightarrow$ Targeted Diff Audits $\rightarrow$ QA $\rightarrow$ Gatekeeper).
- **Target Time Budget:** $\le 15$ minutes.
- **Critic Required:** Single-pass domain critics (`backend-critic`, `frontend-critic`).
- **Success Criteria:** Parallel execution overlap, max 1 review round, exit code 0.

### Task 3: Tier 2 Deep Security / Data Migration Task (Auth / Migration)
- **Objective:** Apply database schema migration and update password hash verification logic.
- **Expected Mode:** Standard or Enterprise Mode with Tier 2 review.
- **Target Time Budget:** $\le 25$ minutes.
- **Critic Required:** Strongest configured critic + independent security verification + regression test suite.
- **Success Criteria:** Diff-scoped security audit, zero unresolved `BLOCKER` or `HIGH` vulnerabilities, clean build exit code 0.

---

## 3. Running the Benchmark Report

Generate performance analytics using the cross-platform script:
```bash
./scripts/swarm-report.sh
# Or against a specific metrics file:
./scripts/swarm-report.sh path/to/fixture-metrics.jsonl
```
When live runtime benchmarks have not been executed in the active session, the report honestly displays:
`END-TO-END SPEEDUP: NOT MEASURED — RUNTIME UNAVAILABLE`.
