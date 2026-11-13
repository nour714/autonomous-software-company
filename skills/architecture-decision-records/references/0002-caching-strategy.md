# ADR-0002: Caching Strategy with Redis

## Status
Accepted

## Context
Read-heavy workloads on frequently accessed queries (user sessions, product catalogs, permissions) generate redundant database query load, increasing p95 latency.

## Decision
We will introduce Redis as a distributed, in-memory caching layer with a Cache-Aside (Lazy Loading) pattern and strict Time-To-Live (TTL) policies.

## Alternatives
- **In-Memory Local Cache (Process memory):** Fast and simple, but causes cache inconsistency across multiple scaled service instances.
- **Memcached:** High performance key-value store, but lacks data structures (hashes, sets, sorted sets) and persistence options offered by Redis.

## Consequences
- **Positive:** Significant reduction in database load, sub-millisecond read latency for cached items.
- **Negative:** Added infrastructure component to operate; requires explicit cache invalidation strategies to prevent stale data.
