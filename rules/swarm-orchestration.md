# Multi-Agent Swarm Orchestration Rules

Canonical rules and governance standards for the autonomous engineering system. `config/swarm.config.yaml` is the single authoritative source of truth for model assignments, fallback mappings, numerical budgets, and agent profiles.

---

## 1. Squad Roster & Responsibilities
The autonomous engineering team operates as a **10-agent squad (4 Builder-Critic tracks + Dispatcher + Monitor)**:

1. 🎯 `dispatcher`: Requirement deconstruction, adaptive mode selection, risk-tier assignment, task allocation, and dependency tracking.
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
