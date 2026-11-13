---

name: workflow-orchestration-patterns

description: Design durable workflows with Temporal for distributed systems. Covers workflow vs activity separation, saga patterns, state management, and determinism constraints. Use when building long-running processes, distributed transactions, or microservice orchestration.

metadata:
  icon: account_tree
---

# Workflow Orchestration Patterns

Master workflow orchestration architecture with Temporal, covering fundamental design decisions, resilience patterns, and best practices for building reliable distributed systems.

## Use this skill when

- Working on workflow orchestration patterns tasks or workflows

- Needing guidance, best practices, or checklists for workflow orchestration patterns

## Do not use this skill when

- The task is unrelated to workflow orchestration patterns

- You need a different domain or tool outside this scope

## Instructions

- Clarify goals, constraints, and required inputs.

- Apply relevant best practices and validate outcomes.

- Provide actionable steps and verification.

## When to Use Workflow Orchestration

### Ideal Use Cases (Source: docs.temporal.io)

- **Multi-step processes** spanning machines/services/databases

- **Distributed transactions** requiring all-or-nothing semantics

- **Long-running workflows** (hours to years) with automatic state persistence

- **Failure recovery** that must resume from last successful step

- **Business processes**: bookings, orders, campaigns, approvals

- **Entity lifecycle management**: inventory tracking, account management, cart workflows

- **Infrastructure automation**: CI/CD pipelines, provisioning, deployments

- **Human-in-the-loop** systems requiring timeouts and escalations

### When NOT to Use

- Simple CRUD operations (use direct API calls)

- Pure data processing pipelines (use Airflow, batch processing)

- Stateless request/response (use standard APIs)

- Real-time streaming (use Kafka, event processors)

## Reference Documentation Index

Load these specialized references on-demand only when the task requires in-depth details:

- [Workflows vs Activities & Design Patterns](references/workflows-vs-activities-and-patterns.md) — Decision boundary, Saga patterns, Entity workflows, and Fan-out orchestration.

- [Determinism, Resilience & Best Practices](references/determinism-resilience-best-practices.md) — Determinism constraints, retry policies, heartbeats, idempotency, and operational pitfalls.
