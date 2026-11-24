---

name: backend-feature-development

description: "Orchestrate end-to-end backend feature development from requirements to deployment. Use when coordinating multi-phase feature delivery across teams and services."

metadata:
  icon: code
---

Orchestrate end-to-end feature development from requirements to production deployment:

[Extended thinking: This workflow orchestrates specialized agents through comprehensive feature development phases - from discovery and planning through implementation, testing, and deployment. Each phase builds on previous outputs, ensuring coherent feature delivery. The workflow supports multiple development methodologies (traditional, TDD/BDD, DDD), feature complexity levels, and modern deployment strategies including feature flags, gradual rollouts, and observability-first development. Agents receive detailed context from previous phases to maintain consistency and quality throughout the development lifecycle.]

## Use this skill when

- Coordinating end-to-end feature delivery across backend, frontend, and data

- Managing requirements, architecture, implementation, testing, and rollout

- Planning multi-service changes with deployment and monitoring needs

- Aligning teams on scope, risks, and success metrics

## Do not use this skill when

- The task is a small, isolated backend change or bug fix

- You only need a single specialist task, not a full workflow

- There is no deployment or cross-team coordination involved

## Instructions

1. Confirm feature scope, success metrics, and constraints.

2. Select a methodology and define phase outputs.

3. Orchestrate implementation, testing, and security validation.

4. Prepare rollout, monitoring, and documentation plans.

Steps marked **Role** name a specialist perspective: apply the matching skill when it is installed, otherwise perform the step directly.

## Safety

- Avoid production changes without approvals and rollback plans.

- Validate data migrations and feature flags in staging first.

## Configuration Options

### Development Methodology

- **traditional**: Sequential development with testing after implementation

- **tdd**: Test-Driven Development with red-green-refactor cycles

- **bdd**: Behavior-Driven Development with scenario-based testing

- **ddd**: Domain-Driven Design with bounded contexts and aggregates

### Feature Complexity

- **simple**: Single service, minimal integration (1-2 days)

- **medium**: Multiple services, moderate integration (3-5 days)

- **complex**: Cross-domain, extensive integration (1-2 weeks)

- **epic**: Major architectural changes, multiple teams (2+ weeks)

### Deployment Strategy

- **direct**: Immediate rollout to all users

- **canary**: Gradual rollout starting with 5% of traffic

- **feature-flag**: Controlled activation via feature toggles

- **blue-green**: Zero-downtime deployment with instant rollback

- **a-b-test**: Split traffic for experimentation and metrics

## Reference Documentation Index

Load these specialized references on-demand only when the task requires in-depth details:

- [Development Lifecycle Phases](references/development-phases.md) — Step-by-step guidance across Discovery, Implementation, Testing, and Deployment.

- [Parameters & Rollback Strategies](references/parameters-and-rollback.md) — Execution parameters, quality gates, and automated rollback triggers.
