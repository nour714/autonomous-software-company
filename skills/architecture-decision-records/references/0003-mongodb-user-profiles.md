# ADR-0003: MongoDB for User Profiles

## Status
Deprecated (Superseded by ADR-0020)

## Context
Initial product designs anticipated rapid, unstructured changes to user profile attributes, preferences, and third-party provider metadata.

## Decision
Adopt MongoDB as a dedicated document store for user profile records alongside the primary database.

## Alternatives
- **PostgreSQL JSON columns:** Available, but initially evaluated as less flexible for rapid exploratory schema experimentation.
- **DynamoDB:** Fully managed, but created cloud vendor lock-in concerns for on-premise deployments.

## Consequences
- **Positive:** Rapid prototyping without migration scripts during early phase.
- **Negative:** Dual database overhead, distributed consistency challenges, lack of foreign key constraints with core relational entities.
