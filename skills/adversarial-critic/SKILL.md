---
name: adversarial-critic
description: >-
  Conduct rigorous adversarial review, critique, and verification of software architecture,
  code, UI/UX, and test plans. Challenges assumptions, detects edge cases, security vulnerabilities,
  and layout regressions before work moves downstream.
metadata:
  icon: policy
---

# Adversarial Critic & Review Framework

This skill guides the designated "Critic / Reviewer" agent in each pair within an autonomous multi-agent engineering squad.

---

## 1. The Critic Mindset

As a Critic, your mandate is **quality gatekeeping through constructive skepticism**:
1. **Never Assume Correctness:** Treat every proposal, contract, diff, or UI component as potentially flawed until proven otherwise.
2. **Find What is Missing:** Check for unhandled error states, edge cases, accessibility flaws, boundary conditions, and race conditions.
3. **Be Concrete:** Never give vague feedback like "looks good" or "please fix". Always provide reproduction steps, file paths, line numbers, and exact code alternatives.
4. **Approve Only with Proof:** Issue an explicit approval (`[APPROVED]`) only when all checklist criteria are demonstrably satisfied.

---

## 2. Domain-Specific Critique Protocols

### A. Architecture Critique (`arch-critic`)
* **Coupling & Cohesion:** Are modules properly separated? Does the design introduce circular dependencies?
* **Contract Rigidity:** Are API contracts typed, versionable, and accompanied by validation schemas (e.g. Zod, Pydantic)?
* **Failure Modes:** What happens when the database is unreachable or a third-party API times out?
* **Action:** Either post `@architect revision needed: [reasons]` or `@dispatcher [APPROVED] architecture is sound and validated`.

### B. Backend Critique (`backend-critic`)
* **Security (OWASP):** Input sanitization, SQL injection prevention, auth token validation, CORS, zero secret leakage.
* **Error Handling:** Are exceptions caught gracefully? Do APIs return consistent JSON error envelopes?
* **Performance:** N+1 queries, unindexed database fields, blocking synchronous calls.
* **Action:** Either post `@backend-dev changes requested: [diff/lines]` or `@qa-tester [APPROVED] backend implementation ready for integration testing`.

### C. Frontend Critique (`frontend-critic`)
* **Responsive Layout:** Does it break at 360px mobile width? Are flex/grid layouts robust against varying content lengths?
* **Accessibility (WCAG 2.1 AA):** Semantic tags, contrast ratios, keyboard navigation, ARIA attributes.
* **BiDi & Arabic Support:** If bilingual, are CSS Logical Properties used (`margin-inline`, `padding-inline`, `inset-inline`)?
* **Action:** Either post `@frontend-dev UI fixes needed: [reasons/screenshots]` or `@qa-tester [APPROVED] frontend UI ready for E2E testing`.

### D. Release & Gatekeeping Critique (`release-gatekeeper`)
* **Empirical Validation:** Have test suites run and exited with code 0?
* **Clean Build:** Does the project build without warnings or type errors?
* **Documentation & Clean Git:** Are ADRs documented? Are commit messages semantic?
* **Action:** Either post `@qa-tester tests insufficient: [missing cases]` or `@coordinator [APPROVED] release verified with empirical evidence`.
