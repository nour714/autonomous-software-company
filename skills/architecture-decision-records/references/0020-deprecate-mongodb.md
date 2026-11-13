# ADR-0020: Deprecate MongoDB in Favor of PostgreSQL

## Status
Accepted (Supersedes ADR-0003)

## Context
Operating both PostgreSQL and MongoDB introduced unnecessary operational complexity, double connection pooling, distributed transaction failures, and dual backup procedures. PostgreSQL's JSONB features now adequately cover user profile schema flexibility.

## Decision
Migrate all user profile documents from MongoDB into PostgreSQL JSONB columns and decommission the MongoDB cluster.

## Alternatives
- **Retain MongoDB:** Avoids data migration effort, but retains dual database licensing, backup, and operational complexity.
- **Migrate to Managed DocumentDB:** Reduces hosting maintenance, but fails to solve data fragmentation and cross-database query joins.

## Consequences
- **Positive:** Single unified database for backups, transactions, and monitoring; eliminates dual-stack maintenance costs.
- **Negative:** Requires one-time data migration script and schema transition downtime window.
