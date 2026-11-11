---
name: task-dispatching
description: >-
  Break down complex user requests into technical user stories, dependency graphs,
  and coordinate peer-to-peer handoffs across an autonomous multi-agent engineering squad.
  Use when distributing tasks, managing project milestones, or orchestrating agent pipelines.
metadata:
  icon: account_tree
---

# Task Dispatching & Sprint Orchestration

This skill provides the operational framework for the Dispatcher / Project Lead agent in an autonomous multi-agent software engineering team.

---

## 1. Core Objectives

1. **Deconstruct Requirements:** Translate the user's high-level goal into an explicit Technical Specification and Task Breakdown.
2. **Eliminate Resource Collisions:** Define clear directory boundaries, interface contracts, and task dependencies so that parallel agents never edit the same files.
3. **Manage Pipeline Handoffs:** Track task status across the Builder-Critic pairs and ensure work moves downstream only after receiving verified approval.

---

## 2. Dispatching Workflow

### Phase 1: Intake & Specification
1. Inspect existing project structure and identify the active tech stack.
2. Generate a minimal, concrete specification containing:
   - Target User Stories & Acceptance Criteria.
   - Non-negotiable quality constraints (WCAG 2.1 AA, 360px+ responsive, zero exposed secrets).
   - Module boundaries: Server directory, Client directory, Test directory.

### Phase 2: Dependency Graph & Assignment
Define the execution order across the 4 specialist pairs:

```
[ Intake ]
    │
    ▼
[ Architecture Track: architect + arch-critic ]
    │
    ├─────────────────────────────┐
    ▼                             ▼
[ Backend Track ]          [ Frontend Track ]
(backend-dev + critic)     (frontend-dev + critic)
    │                             │
    └──────────────┬──────────────┘
                   ▼
       [ Quality & Release Track ]
       (qa-tester + release-gatekeeper)
```

### Phase 3: Board Coordination & Gatekeeping
* Post task assignments to the Swarm Board using sequence numbers (`#seq`).
* Monitor approvals from Critic agents:
  - Do not let `backend-dev` or `frontend-dev` proceed until `arch-critic` approves the architecture.
  - Do not let `qa-tester` run final test passes until both `backend-critic` and `frontend-critic` sign off on implementation quality.
* Summarize completed deliverables to the Coordinator once `release-gatekeeper` verifies the final build.
