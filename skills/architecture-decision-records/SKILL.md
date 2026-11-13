---

name: architecture-decision-records

description: Write and maintain Architecture Decision Records (ADRs) following best practices for technical decision documentation. Use when documenting significant technical decisions, reviewing past architectural choices, or establishing decision processes.

---

# Architecture Decision Records

## Use this skill when
- Making significant architectural choices (frameworks, databases, patterns).
- Documenting technical decisions for future engineers and agents.
- Deprecating or superseding past architectural decisions.

## Do not use this skill when
- Making routine bug fixes or small configuration changes.
- Writing code-level implementation details without architectural impact.

## Instructions
1. Review existing ADRs before proposing new architectural choices.
2. Select appropriate template from [ADR Templates](references/adr-templates-and-examples.md).
3. Record Context, Decision, Alternatives, and Consequences.
4. Follow review and status transition rules in [ADR Lifecycle](references/lifecycle-and-review.md).

## Core Concepts
An ADR captures:
- **Context:** Why a decision is required.
- **Decision:** What was decided and rationale.
- **Consequences:** Positive and negative outcomes.

```
Proposed → Accepted → Deprecated → Superseded
              ↓
           Rejected
```

## Creating a New ADR
1. Copy template from `references/adr-templates-and-examples.md`.
2. Name file `NNNN-title-with-dashes.md` in `docs/adr/`.
3. Submit for review; see checklist in `references/lifecycle-and-review.md`.
4. Update ADR index table upon sign-off.

## Best Practices
- **Write early:** Before implementation starts.
- **Keep concise:** 1–2 pages focusing on architectural rationale.
- **Honest trade-offs:** Explicitly document costs and negative consequences.
- **Never mutate accepted ADRs:** Supersede with a new ADR when requirements change.

## Reference Documentation Index
Load these specialized references on-demand only when the task requires in-depth details:

- [ADR Templates & Comprehensive Examples](references/adr-templates-and-examples.md) — Standard Markdown, MADR, RFC-style templates, and deprecation structures.
- [ADR Lifecycle & Review Checklist](references/lifecycle-and-review.md) — Status state machine, PR review guidelines, and quality checklists.
- [Sample ADR-0001: PostgreSQL](references/0001-use-postgresql.md)
- [Sample ADR-0002: Redis Caching](references/0002-caching-strategy.md)
- [Sample ADR-0003: MongoDB Profiles](references/0003-mongodb-user-profiles.md)
- [Sample ADR-0020: Deprecate MongoDB](references/0020-deprecate-mongodb.md)
