---
name: hashimoto-harness-loop
description: >-
  Mitchell Hashimoto's Model + Harness engineering pattern for AI coding agents.
  Enforces deterministic test harnesses, git-backed feedback loops, read-before-write,
  and state validation. Use when developing reliable, robust features and systems.
metadata:
  icon: terminal
---

# Mitchell Hashimoto AI Agent Harness Pattern

Codified from Mitchell Hashimoto's (HashiCorp founder, creator of Terraform, Vagrant, Ghostty) writings on AI adoption and the **Model + Harness** architecture.

---

## 1. The Model + Harness Philosophy

An LLM alone is non-deterministic and prone to drift. Reliability comes from the **Harness**:
1. **The Test Harness is the Source of Truth:** Code is only correct when an automated test harness confirms it. The agent must run tests, observe output, and iterate.
2. **Git-Backed Feedback Loops:** Every logical step should be committed or diff-checked. If an approach fails, roll back via git cleanly rather than stacking messy patches.
3. **Read Before Write:** Always inspect the actual source code, dependencies, and environment before proposing or applying modifications. Never write code based on memory or assumptions.
4. **Deterministic Environments:** Favor reproducible CLI commands, structured output logs, and clean exit codes (`0`) over speculative chat assertions.

---

## 2. The Execution Loop

```
[ Read & Inspect ] ──► [ Plan Minimal Change ] ──► [ Apply Surgical Diff ]
        ▲                                                      │
        │                                                      ▼
[ Git Revert / Retry ] ◄── [ Test Harness Fails ] ◄── [ Run Harness / Verification ]
                                                               │
                                                               ▼ (Passes)
                                                     [ Git Commit / Done ]
```

---

## 3. Core Directives

* **Harness First:** If no test harness exists for the target feature, write the verification test before writing the business logic.
* **Inspect Real State:** Run commands to verify compiler versions, installed packages, and active files.
* **Clean State Transitions:** Never leave broken syntax or failing tests unaddressed.
