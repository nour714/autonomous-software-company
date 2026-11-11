---
name: karpathy-guidelines
description: >-
  Core coding agent guidelines derived from Andrej Karpathy's principles on preventing
  LLM coding pitfalls. Enforces thinking before coding, minimum viable diffs, surgical changes,
  and goal-driven verification. Use across all development, refactoring, and debugging tasks.
metadata:
  icon: lightbulb
---

# Andrej Karpathy AI Coding Principles

Derived from Andrej Karpathy's observations on LLM coding failure modes (over-engineering, silent assumptions, bloated diffs, and lack of verification).

---

## 1. Think Before Coding

* **Don't Assume, Don't Hide Confusion:** State assumptions explicitly before implementing changes. If a user prompt is ambiguous or multiple approaches exist, lay out the tradeoffs rather than guessing.
* **Surface Tradeoffs Early:** Point out edge cases or architectural risks upfront.
* **Push Back on Complexity:** If a simpler, more direct approach exists, recommend it immediately.

---

## 2. Simplicity First

* **Minimum Code That Solves the Problem:** Write the absolute minimum code required to solve the task. Nothing speculative, nothing unrequested.
* **No Speculative Abstractions:** Do not build premature helpers, single-use utility wrappers, or unrequested "future flexibility".
* **The Senior Engineer Test:** Ask yourself: *"Would a principal engineer reject this diff as overcomplicated?"* If yes, refactor it down to the essentials.

---

## 3. Surgical Changes

* **Touch Only What You Must:** Keep diffs minimal, clean, and strictly scoped to the user request.
* **No Drive-by Refactoring:** Do not clean up formatting, reorder imports, or rewrite comments in unrelated files.
* **Preserve Working Code:** Respect existing conventions, patterns, and working architecture.

---

## 4. Goal-Driven Execution

* **Define Concrete Success Criteria:** Know exactly what "done" looks like before writing code (e.g. passing test, expected CLI exit code, clean response envelope).
* **Verify Empirically:** Never declare a task complete without executing tests or inspecting runtime evidence. Evidence before assertions always.
