---
name: four-agent-swarm
description: >-
  Orchestrates an adaptive 10-agent software engineering squad (4 Builder-Critic tracks +
  Task Dispatcher + Stall Monitor). Note: four-agent-swarm is a backward-compatible alias
  for the complete 10-agent adaptive engineering system.
  Use when the user asks to "شغل 4 ايجنت", "شغل 9 ايجنت", "شغل الفريق", "شغل الشركة البرمجية", "swarm team", "/swarm".
metadata:
  icon: hub
---

# Autonomous Engineering Swarm Orchestrator (10-Agent Adaptive Squad)

Coordinates an enterprise-grade autonomous software engineering system composed of 10 specialized agents organized into **4 Builder-Critic tracks**, **1 Task Dispatcher**, and **1 Stall Monitor**. Models, numerical thresholds, risk policies, and fallbacks are centrally governed by `config/swarm.config.yaml`.

## 1. Squad Visual Identity & Track Roster

| Track | Icon | Agent | Technical Role | Responsibility | Workspace |
|---|:---:|---|---|---|:---:|
| **Orchestration** | 🎯 | `dispatcher` | Task Dispatcher | Requirement breakdown, adaptive mode routing, dependency tracking | `inherit` |
| **Architecture** | 🏛️ | `architect` | Lead Architect | System design, domain models, API contract specifications with mocks | `inherit` |
| | 🧐 | `arch-critic` | Architecture Critic | Structural review, anti-pattern detection, contract freeze sign-off | `inherit` |
| **Backend** | ⚙️ | `backend-dev` | Backend Engineer | Server endpoints, business logic, database migrations | `share` |
| | 🛡️ | `backend-critic` | Backend Critic | Diff-scoped security audit, OWASP Top 10 checks, SQL optimization | `inherit` |
| **Frontend** | 🎨 | `frontend-dev` | Frontend Engineer | Responsive UI (360px+), accessible components, mock-driven integration | `share` |
| | 👁️ | `frontend-critic` | Frontend Critic | Visual verification, 360px mobile viewport audit, WCAG 2.1 AA, XSS checks | `inherit` |
| **Quality & Release** | 🧪 | `qa-tester` | QA Automation | Shift-left TDD, test harness design, unit/integration/E2E execution | `inherit` |
| | 🚀 | `release-gatekeeper` | Release Gatekeeper | Build integrity, empirical test verification, release sign-off | `inherit` |
| **Safety Net** | 📡 | `monitor` | Stall Monitor | Activity tracking, 3-minute stall pings, deadlock escalation | `inherit` |

## 2. Adaptive Execution Modes & Risk Tiers

The Dispatcher evaluates 8 factors (complexity, affected modules, security impact, DB impact, FE/BE involvement, architectural novelty, required verification, estimated time) and selects the smallest safe mode. **Execution Mode and Risk Tier are independent decisions** (e.g., a 3-line auth change is Quick Mode + Tier 2; documentation refactor is Tier 0). Never downgrade Risk Tier because implementation size is small.

- **Quick Mode (2–3 agents):** Small bug fixes, minor UI adjustments, docs. `Dispatcher -> Dev -> Self-Verification` (+ lightweight Critic if Tier 1, or QA if test-heavy; no Architect unless needed).
- **Standard Mode (4–5 agents):** Normal features, DB-backed endpoints, moderate refactors. `Dispatcher -> Architecture -> Parallel Devs -> Relevant Critic(s) -> QA -> Release Gatekeeper`.
- **Enterprise Mode (9 working agents + 1 Monitor = 10 agents):** Platform-wide features, core architecture, critical auth/database migrations. Full squad engagement.

### Risk-Tiered Review (Stored in `.swarm/state.json`)
- **Tier 0 (Fast Lane — 5m budget):** Docs, comments, non-security config. No critic required; author self-verifies with `git diff`.
- **Tier 1 (Standard Review — 15m budget):** Normal features, routine APIs. Diff-scoped review by 1 lightweight critic; targeted tests.
- **Tier 2 (Deep Review — 25m budget):** Auth, payments, migrations, security rules, user data. Strongest configured critic + independent security verification + full regression suite. Critics may escalate a tier upward, but can never silently downgrade it.

## 3. High-Speed Pipelined Workflow & Streamed Parallelism

```
[ User Request ] ──► 🎯 [ dispatcher ] ──► 🏛️ [ architect ] ──► 🧐 [ arch-critic ]
                                                                       │ (Contracts Approved & Frozen)
                     ┌─────────────────────────────────────────────────┼──────────────────────────────┐
                     ▼ (Parallel Implementation)                       ▼ (Mock-Driven Frontend)       ▼ (Shift-Left TDD)
               ⚙️ [ backend-dev ]                                🎨 [ frontend-dev ]            🧪 [ qa-tester ]
                     │                                                 │                              │ (Harnesses Ready)
                     ▼                                                 ▼                              │
               🛡️ [ backend-critic ]                             👁️ [ frontend-critic ]               │
                     │ (Approved)                                      │ (Approved)                   │
                     └─────────────────────────┬───────────────────────┘                              │
                                               ▼                                                      │
                                        🧪 [ qa-tester ] ◄────────────────────────────────────────────┘
                                               │ (Executes Full Unit, Integration & E2E Suites)
                                               ▼
                                  🚀 [ release-gatekeeper ] ──► 🎯 [ dispatcher ] ──► [ Delivery ]
```

1. **Shift-Left TDD & Contract Freeze:** As soon as contracts are approved by `@arch-critic`, contracts are frozen and `@qa-tester` begins drafting test harnesses while `@backend-dev` and `@frontend-dev` build in parallel. Reopening contracts requires a formal Dispatcher decision card.
2. **Right-Sized Tasks:** Max 5 files per task unit; target duration $\le 15$ minutes. At 80% budget emit 1 status line; at 100% stop extending and report blockers.
3. **Review Caps & Context Hygiene:** Maximum 2 review rounds per task. Critics approve or escalate to `@dispatcher`. Use diff-scoped auditing; never paste full files on board.
4. **Lazy Skill Loading:** Agents preload maximum 3 core skills from `config/swarm.config.yaml`, loading reference files on-demand only.

## 4. Reference Documentation Index

Load these specialized references on-demand only when required:

- [Enterprise Swarm Spawn Runbook](references/spawn-runbook.md) — Single-turn swarm initializations, agent prompts, and zero-downtime fallback procedures.
- [Communication & Verdict Cards](references/communication-cards.md) — Mandatory task cards, standard handoff templates, critic verdict cards, contract reopening forms, and severity gates.
