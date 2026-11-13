# ADR-0001: Use PostgreSQL as Primary Database

## Status
Accepted

## Context
The application requires a robust, scalable relational database supporting structured relational data, ACID compliance for financial/order transactions, and flexible JSON document querying for extensible attributes.

## Decision
We will use PostgreSQL as our primary database engine. It provides mature ACID guarantees, rich indexing capabilities, connection pooling support, and native JSONB data types.

## Alternatives
- **MySQL:** Strong relational support, but less robust JSONB querying and indexing capabilities compared to PostgreSQL.
- **MongoDB:** Highly flexible schema, but lacks multi-table join efficiency and strict relational integrity required for transactional core models.

## Consequences
- **Positive:** Standard SQL compatibility, strong data integrity, powerful JSONB document support, mature ecosystem.
- **Negative:** Schema migrations require structured tooling; vertical scaling limits require read replicas at high scale.
