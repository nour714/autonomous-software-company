# Multi-Agent Swarm Orchestration Rules

Canonical rules and governance standards for the autonomous engineering system. `config/swarm.config.yaml` is the single authoritative source of truth for model assignments, fallback mappings, numerical budgets, and agent profiles.

---

## 1. Squad Roster & Responsibilities
The autonomous engineering team operates as a **10-agent squad (4 Builder-Critic tracks + Dispatcher + Monitor)**:
1. 🎯 `dispatcher`: Requirement deconstruction, adaptive mode selection, risk-tier assignment, task allocation, and file lease management.
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
- **Quick Mode (2–3 agents, `tier_0` default):** Localized fixes (`<= 2` files), minor UI/CSS tweaks, documentation. `Dispatcher -> <relevant-dev> (backend-dev | frontend-dev) -> Self-Verification` (+ lightweight Critic if escalated to Tier 1, or QA if test-heavy; no Architect unless structural design is needed).
- **Standard Mode (5–6 agents, `tier_1` default):** Regular features, database-backed endpoints, moderate refactoring. `Dispatcher -> Architecture (when needed) -> Parallel Devs -> dynamic_critic (backend-critic | frontend-critic by changed paths) -> QA -> Release Gatekeeper`.
- **Enterprise Mode (10 agents):** Platform-wide features, new architectures, critical authentication or database migrations. Full squad engagement.

**Critical Principle:** *Execution Mode and Risk Tier are independent decisions.* Never downgrade Risk Tier because implementation size is small.

---

## 5. Risk-Tiered Review Protocol
Risk tiers govern reviewer depth and time budgets, stored by Dispatcher in `.swarm/state.json`:
- **Tier 0 (Fast Lane — 5m budget):** Docs, comments, copy, non-security config. No critic required; author self-verifies with `git diff`.
- **Tier 1 (Standard Review — 15m budget):** Regular features, routine APIs. Diff-scoped single-pass review by 1 lightweight critic; targeted tests.
- **Tier 2 (Deep Review — 25m budget):** Auth, payments, database migrations, security rules, user data. Strongest configured critic + independent security verification + full regression/integration suite. Critics may escalate a tier upward, but can **never silently downgrade it**.

---

## 6. Streamed Parallel Execution & Contract Freeze
- Once system architecture and API contracts are approved by `arch-critic`, contracts are frozen and `backend-dev`, `frontend-dev` (building against contract mocks), and `qa-tester` (drafting deterministic harnesses) execute concurrently in isolated workspaces (`workspace: "share"` or optional git worktree isolation via `node scripts/swarm-cli.cjs worktree create`).
- Reopening a frozen contract requires a formal Dispatcher decision card specifying interface changes, rationale, mock/test updates, and notifications to all dependent agents.
- When `standard` or `enterprise` tracks run in worktrees, `@release-gatekeeper` verifies tests, merges clean branches via `swarm-cli.cjs worktree merge`, and cleans up via `worktree cleanup --delete-branch`.

---

## 7. Tasks, Protocol Cards & Review Caps
- **Right-Sized Tasks:** Maximum 5 touched files per task unit; target duration $\le 15$ minutes.
- **Time Budgets:** Progress update at 80% budget; stop and report blockers at 100% budget.
- **Review Cap:** Maximum 2 review rounds per task. If unresolved after Round 2, escalate a decision card to `@dispatcher`.
- **Communication Cards:** All tasks, handoffs, and critic verdicts follow the standard templates in [Protocol Cards](references/protocol-cards.md).

---

## 8. State Management, File Locks & Stall Recovery
- **Runtime State (`.swarm/`):** Managed deterministically via `node scripts/swarm-cli.cjs` (`init`, `lock`, `log-metric`, `check-stalls`, `status`); never hand-edit `.swarm/state.json` or `.swarm/metrics.jsonl`. See [Runtime State & Stall Runbook](references/runtime-state.md).
- **Single Active Writer:** Exactly one active writer per file at any moment enforced via `swarm-cli.cjs lock acquire`. Critics and QA hold read-only access.
- **Stall Detection:** `@dispatcher` runs `node scripts/swarm-cli.cjs check-stalls`; when it exits with code `2`, invoke `@monitor` on demand for targeted ping (3m) and escalation (5m).
- **Project Memory:** Synchronized via local `.swarm/project-context.md` from `config/project-context.template.md` with verified Git commit hash (`git rev-parse HEAD`). Zero secret exposure.

---

## 9. Fix-With-Test Verification Rule
Each accepted finding yields an actionable code patch plus a deterministic regression test that fails before the fix and passes after, with both command outputs and exit codes recorded. Refer to [audit-reporting](../skills/audit-reporting/SKILL.md) for finding schemas and verification standards.

---

## 10. Reference Documentation Index
- [Communication Protocol Cards](references/protocol-cards.md) — Mandatory task cards, handoff cards, critic verdicts, and severity gates.
- [Runtime State & Stall Runbook](references/runtime-state.md) — State schema, single-writer file locks, stall timeouts, and safe reassignment procedures.
