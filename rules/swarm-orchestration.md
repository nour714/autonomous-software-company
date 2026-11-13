# Multi-Agent Swarm Orchestration Rules

Canonical rules and governance standards for the autonomous engineering system. `config/swarm.config.yaml` is the single authoritative source of truth for model assignments, fallback mappings, numerical budgets, and agent profiles.

---

## 1. Squad Roster & Responsibilities
The autonomous engineering team operates as a **10-agent squad (4 Builder-Critic tracks + Dispatcher + Monitor)**:

1. 🎯 `dispatcher`: Requirement deconstruction, adaptive mode selection, risk-tier assignment, task allocation, dependency tracking, and file lease management.
2. 🏛️ `architect` & 🧐 `arch-critic`: System architecture, domain models, interface definitions, contract freeze sign-off, and over-engineering defense.
3. ⚙️ `backend-dev` & 🛡️ `backend-critic`: Server endpoints, data validation, database schemas/migrations, and diff-scoped security audits (`security-audit`).
4. 🎨 `frontend-dev` & 👁️ `frontend-critic`: Responsive user interfaces (360px+), accessibility (WCAG 2.1 AA), mock-driven development, and interface auditing (`better-interface`).
5. 🧪 `qa-tester` & 🚀 `release-gatekeeper`: Shift-left TDD, automated unit/integration/E2E test suites, build integrity, and empirical release gatekeeping.
6. 📡 `monitor`: Swarm liveness monitoring, 3-minute stall detection, and deadlock escalation.

*Backward Compatibility Note:* The skill directory `skills/four-agent-swarm/` acts as the backward-compatible entry point and alias for the complete 10-agent adaptive squad. Supported trigger phrases: `شغل 4 ايجنت`, `شغل 9 ايجنت`, `شغل الفريق`, `شغل الشركة البرمجية`, `swarm team`, and `/swarm` # TODO(verify) runtime slash-command alias support.

---

## 2. Canonical Configuration & Model Governance
- All model identifiers, fallback mappings, and thinking budgets are defined exclusively in `config/swarm.config.yaml`.
- Hard-coded model IDs and static provider quota percentages are forbidden in orchestration rules.
- On the first verified quota, rate-limit, or model execution error, the agent switches directly to `models.fallback_map` via `swarm{action: "model"}` without an endless retry loop. If fallback is `null` or unavailable, report the task as `BLOCKED`.

---

## 3. Lazy Skill Loading Protocol
- Agents preload a **maximum of 3 core skills** as configured in `agent_profiles.*.skills_preloaded`.
- Agents must load the core `SKILL.md` first, inspect operational checklists, and load detailed `references/*.md` files only on demand when the active task requires them.
- Never reread unchanged reference files or broad directories across consecutive turns.

---

## 4. Adaptive Execution Modes
The Dispatcher evaluates 8 factors (complexity, affected modules, security impact, DB impact, FE/BE involvement, architectural novelty, required verification, estimated time) and selects the smallest safe mode:

- **Quick Mode (2–3 agents):** Localized fixes, minor UI/CSS tweaks, documentation, small utility functions. `Dispatcher -> Relevant Dev -> Self-Verification` (+ lightweight Critic if Tier 1, or QA if test-heavy; no Architect unless structural design is needed).
- **Standard Mode (4–5 agents):** Regular features, database-backed endpoints, moderate refactoring. `Dispatcher -> Architecture -> Parallel Devs -> Relevant Critic(s) -> QA -> Release Gatekeeper`.
- **Enterprise Mode (9 working agents + 1 Monitor = 10 agents):** Platform-wide features, new system architectures, critical authentication or database migrations. Full squad engagement.

**Critical Principle:** *Execution Mode and Risk Tier are independent decisions.* For example, a 3-line auth fix runs in Quick Mode with Tier 2 review; a 50-page docs update runs in Standard/Quick Mode with Tier 0 review. Never downgrade Risk Tier because implementation size is small.

---

## 5. Risk-Tiered Review Protocol
Risk tiers govern reviewer depth and time budgets, stored by Dispatcher in `.swarm/state.json`:

- **Tier 0 (Fast Lane — 5m budget):** Documentation, comments, copy, pure CSS spacing/colors, non-security config. No critic required; author self-verifies and submits `git diff` evidence.
- **Tier 1 (Standard Review — 15m budget):** Regular features, routine APIs, isolated components. Diff-scoped single-pass review by 1 lightweight critic per domain; targeted tests; no full codebase rescan.
- **Tier 2 (Deep Review — 25m budget):** Authentication, sessions, payments, database migrations, security rules, user data, input parsing, secrets. Strongest configured critic + independent security verification + full regression/integration suite + explicit approval before handoff.
- Critics may escalate a tier upward based on discovered risks, but can **never silently downgrade it**.

---

## 6. Streamed Parallel Execution & Contract Freeze
- Once system architecture and API contracts are approved by `arch-critic`, `architect` and `arch-critic` enter standby, contracts are frozen, and `backend-dev`, `frontend-dev` (building against contract mocks), and `qa-tester` (drafting deterministic harnesses) execute concurrently.
- Authors use shared workspaces (`workspace: "share"`) to eliminate file collisions.
- Reviews occur incrementally module-by-module as commits finish.
- Reopening a frozen contract requires a formal Dispatcher decision card specifying the affected interface, rationale, required mock/test updates, and notifications to all dependent agents.

---

## 7. Right-Sized Tasks & Time Budgets
- **Size Limit:** Maximum 5 touched files per task unit; target duration $\le 15$ minutes (default budgets: Tier 0 = 5m, Tier 1 = 15m, Tier 2 = 25m).
- **Mandatory Task Card Template:**
```markdown
┌────────────────────────────────────────────────────────────┐
│ TASK: [Feature / Bugfix / Refactor Title]                  │
│ TASK_ID: TASK-[NUMBER]                                     │
│ MODE: [quick | standard | enterprise]                      │
│ RISK_TIER: [tier_0 | tier_1 | tier_2]                      │
│ OWNER: [@agent-name]                                       │
│ ASSIGNED_AGENTS: [@agent1, @agent2, ...]                   │
│ OWNED_FILES: [file1, file2, ... (max 5 files)]             │
│ DEPENDENCIES: [None | TASK-X approved contracts]           │
│ TIME_BUDGET_MINUTES: [5 | 15 | 25]                         │
│ ACCEPTANCE_CRITERIA:                                       │
│  - [Criterion 1]                                           │
│  - [Criterion 2]                                           │
│ VERIFICATION_COMMANDS: [e.g., npm test, pytest]           │
│ STATUS: [🟡 IN_PROGRESS | 🟢 READY_FOR_REVIEW]             │
└────────────────────────────────────────────────────────────┘
```
- **Time Budget Enforcement:**
  - At **80% budget**: Emit a single-line progress update on the board.
  - At **100% budget**: Stop extending execution without approval; report completed work, remaining work, blockers, evidence, and recommend a reduced scope.

---

## 8. Context Hygiene, Handoff Cards & Review Caps
- **Context Hygiene:** Batch reads, use surgical patches and `git diff`, and never paste full file bodies onto the Swarm Message Board.
- **Standard Handoff Card:**
```markdown
┌────────────────────────────────────────────────────────────┐
│ [AGENT / ROLE]: [@agent-name / Role Name]                  │
│ TASK_ID: TASK-[NUMBER]                                     │
│ STATUS: [🟢 COMPLETED | 🟡 PARTIAL]                        │
│ CHANGED_FILES: [file1, file2, ...]                         │
│ CONTRACT_SUMMARY: [Payload shapes, route definitions]      │
│ TESTS_RUN: [Specific test command executed]                │
│ TEST_RESULTS: [Exit code 0, X passed, 0 failed]            │
│ KNOWN_BLOCKERS: [None | blocker details]                   │
│ NEXT_OWNER: [@critic-name or @qa-tester]                   │
└────────────────────────────────────────────────────────────┘
```
- **Critic Verdict Card:**
```markdown
┌────────────────────────────────────────────────────────────┐
│ [CRITIC ROLE]: [@critic-name / Domain Critic]              │
│ TASK_ID: TASK-[NUMBER]                                     │
│ VERDICT: [🟢 APPROVED | 🔴 CHANGES_REQUESTED]               │
│ REVIEW_ROUND: [Round 1 of 2 | Round 2 of 2 (FINAL)]        │
│ BLOCKERS: [None | Blocker description (must be resolved)]  │
│ FOLLOWUPS: [None | Non-blocking item -> .swarm/followups.md]│
│ EVIDENCE: [git diff scoped check, verified output logs]    │
│ NEXT_AGENT: [@author-name (if rejected) or @next-stage]    │
└────────────────────────────────────────────────────────────┘
```
- **Review Cap:** Maximum 2 review rounds per task. If issues remain after Round 2, the critic must not trigger an automatic Round 3; they must escalate a single consolidated decision card to `@dispatcher`.
- **Severity Gates:**
  - `BLOCKER` & `HIGH`: Security vulnerabilities, contract breaks, test failures, or data loss. **Strictly block handoff.**
  - `MEDIUM` & `LOW`: Polish, styling notes, non-critical refactors. Appended to `.swarm/followups.md` without blocking handoff. Never downgrade a security blocker to accelerate delivery.

---

## 9. Shared Swarm Run State (`.swarm/` Ephemeral Architecture)
The `.swarm/` directory is strictly ignored by Git (`.gitignore`). It stores local runtime execution state and telemetry:

1. `.swarm/state.json`: The single authoritative task registry and file-ownership lease database, managed exclusively by `@dispatcher`.
   - `schema_version: 1`
   - `tasks`: Array of active/completed tasks containing:
     - `task_id`: Unique identifier (e.g., `TASK-001`).
     - `mode`: Selected execution mode (`quick`, `standard`, `enterprise`).
     - `tier`: Assigned risk tier (`tier_0`, `tier_1`, `tier_2`).
     - `owner`: Currently assigned agent name.
     - `owned_files`: List of files leased to this agent (max 5 files).
     - `lease_status`: `"active"` or `"revoked"`.
     - `status`: `"pending"`, `"in_progress"`, `"review"`, `"completed"`, or `"blocked"`.
     - `time_budget_minutes`: Numeric minute budget for task unit.
     - `review_rounds`: Current review cycle count (0, 1, or 2).
     - `dependencies`: List of preceding task IDs.
     - `started_at`, `updated_at`, `last_heartbeat_at`: ISO 8601 timestamps.
2. `.swarm/followups.md`: Append-only markdown log for deferred `MEDIUM` and `LOW` findings. Each entry records `TASK_ID`, file path, reporting critic, and description.
3. `.swarm/metrics.jsonl`: Append-only JSON Lines performance log. Supports two record types:
   - `"record_type": "agent_run"`: Tracks per-agent turn duration, files modified, tool calls, and model used.
   - `"record_type": "task_summary"`: Tracks end-to-end task completion time, risk tier, review rounds, fallback count, stall count, and final verdict. Record token/cost metrics only when exposed by the runtime; never fabricate numbers.

---

## 10. Intelligent Stall Detection, Safe Reassignment & File Ownership Locks
1. **File Ownership Locks:**
   - There must be exactly **one active writer per file** at any given moment, recorded in `.swarm/state.json`.
   - Critics and reviewers have read-only access.
   - `@qa-tester` owns only assigned test files and fixtures.
   - Shared integration files (e.g., route registries) have a single designated owner per task.
2. **Stall Detection Procedure:**
   - `@monitor` tracks the latest turn and heartbeat of active agents.
   - At **3 minutes** of inactivity, `@monitor` issues a public board ping with the exact `TASK_ID` to awaken the worker.
   - `@monitor` waits **2 additional minutes**; if no progress or heartbeat is recorded, it escalates to `@dispatcher`.
3. **Safe Reassignment Protocol:**
   - Before `@dispatcher` reassigns any task or file to a fallback agent:
     1. It MUST confirm the previous worker is stopped or detached.
     2. It updates `.swarm/state.json` setting `lease_status: "revoked"`.
     3. It restores the latest verified clean file state via `git checkout` or rollback patch.
     4. It grants explicit ownership and lease status `"active"` to the new agent.
     5. If the runtime cannot reliably guarantee the previous agent is halted, **never spawn a duplicate concurrent writer**.
4. **Critic Timeout Rules:**
   - **Tier 0:** Author self-verifies; no critic delay possible.
   - **Tier 1:** If the critic review budget expires without blockers detected, the task may proceed with an explicit `UNREVIEWED` marker.
   - **Tier 2:** Tasks touching auth, payments, security, or migrations **NEVER** proceed unreviewed. If a Tier 2 critic stalls, `@dispatcher` escalates immediately to hot-swap or emergency manual intervention.

---

## 11. Dynamic Model Routing, Fallback & Targeted Test Optimization
1. **Dynamic Model Routing:**
   - Low-risk and rapid tasks (Tier 0/1) use fast, responsive models.
   - High-risk tasks (Tier 2) mandate the strongest configured critic model for adversarial verification.
   - Architectural reasoning activates deep reasoning only during novel system design or contract definition.
   - On the first verified quota, rate-limit, or model error, switch immediately to `model_fallback` without retries.
2. **Targeted Test Optimization:**
   - Authors run only targeted tests covering modified files (unit, linter, typecheck).
   - `@qa-tester` drafts deterministic contract tests early and runs integration tests relevant to the changed track.
   - `@release-gatekeeper` executes the complete test suite once at the final release gate for Tier 1 and Tier 2 tasks.

---

## 12. Project Context Memory (`.swarm/project-context.md`)
- All agents read `.swarm/project-context.md` at task startup to synchronize architecture knowledge and constraints.
- Generated from `config/project-context.template.md` with verified Git commit hash (`git rev-parse HEAD`).
- If Git HEAD differs from the recorded commit, the context memory must be refreshed.
- **Strict Prohibition:** Never store secrets, passwords, tokens, API keys, or private endpoints in project memory.
