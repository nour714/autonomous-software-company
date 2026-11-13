# Swarm Communication Protocol Cards

Detailed card templates, review thresholds, and handoff standards for multi-agent coordination.

---

## 1. Mandatory Task Card Template
Dispatched by `@dispatcher` onto the message board and recorded in `.swarm/state.json`:

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

---

## 2. Standard Handoff Card Template
Emitted by authors when handing off completed modules for review or integration:

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

---

## 3. Critic Verdict Card Template
Emitted by domain critics after reviewing git diffs:

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

---

## 4. Severity Gates & Review Round Caps
1. **Review Round Cap:** Maximum 2 review rounds per task. If issues remain after Round 2, the critic must not trigger an automatic Round 3; they must escalate a single consolidated decision card to `@dispatcher`.
2. **Severity Gates:**
   - `BLOCKER` & `HIGH`: Security vulnerabilities, API contract breaks, test failures, or data loss. **Strictly block handoff.**
   - `MEDIUM` & `LOW`: Polish, styling suggestions, non-critical refactors. Appended to `.swarm/followups.md` without blocking handoff. Never downgrade a security blocker to accelerate delivery.
