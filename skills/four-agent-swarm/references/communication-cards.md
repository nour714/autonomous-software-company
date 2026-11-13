# Swarm Communication, Handoff & Verdict Cards

Standardized card schemas and severity gate protocols for the 10-agent autonomous software engineering squad.

---

## 1. Mandatory Task Card Template

Every task assigned by `@dispatcher` must adhere to this structured format:

```markdown
┌────────────────────────────────────────────────────────────┐
│ TASK: [Feature / Bugfix / Refactor Title]                  │
│ TASK_ID: TASK-[NUMBER]                                     │
│ MODE: [quick | standard | enterprise]                      │
│ RISK_TIER: [tier_0 | tier_1 | tier_2]                      │
│ OWNER: [@agent-name]                                       │
│ ASSIGNED_AGENTS: [@agent1, @agent2, ...]                   │
│ OWNED_FILES: [file1, file2, ... (maximum 5 files)]         │
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

Authors (`backend-dev`, `frontend-dev`, `qa-tester`) post this card when passing work to reviewers:

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

Reviewers (`arch-critic`, `backend-critic`, `frontend-critic`, `release-gatekeeper`) issue verdicts using this card:

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

## 4. Contract Reopening Decision Card Template

If a frozen contract must change after architectural sign-off, `@dispatcher` posts:

```markdown
┌────────────────────────────────────────────────────────────┐
│ CONTRACT REOPENING DECISION: CR-[NUMBER]                   │
│ AFFECTED_INTERFACE: [Endpoint path or schema model]        │
│ REASON: [Unforeseen database constraint / edge case]       │
│ MOCK_AND_TEST_UPDATES: [Required mock & test harness diffs]│
│ NOTIFIED_AGENTS: [@backend-dev, @frontend-dev, @qa-tester] │
│ AUTHORIZED_BY: [@dispatcher]                               │
└────────────────────────────────────────────────────────────┘
```

---

## 5. Severity Gates & Review Rules

- **Review Cap:** Maximum 2 review rounds per task. If issues remain after Round 2, the critic must not trigger an automatic Round 3; they must escalate a single consolidated decision card to `@dispatcher`.
- **BLOCKER & HIGH:** Direct vulnerabilities, SQL injection, authentication bypass, data loss, broken API contracts, or build/test failures. **Strictly block handoff.**
- **MEDIUM & LOW:** Polish, minor styling, non-critical refactor suggestions. These do **not** block immediate handoff; record them in `.swarm/followups.md`. Never downgrade a security blocker to expedite delivery.
