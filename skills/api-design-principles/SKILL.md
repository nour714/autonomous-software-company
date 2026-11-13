---
name: api-design-principles
description: >-
  Design production-grade REST and GraphQL APIs following strict contract conventions,
  idempotency, versioning, and validation standards.
metadata:
  icon: api
---

# API Design Principles

Standardizes RESTful interface contracts, parameterization, pagination, idempotency, and status codes.

## Triggering Conditions
- Authoring or updating HTTP REST endpoints, GraphQL schemas, or RPC contracts.
- Defining request/response payloads, pagination interfaces, or error formats.
- Establishing client-server contracts before frontend and backend implementation.

## Operational Checklist
- [ ] Use plural nouns for resources (e.g., `/api/v1/orders`, not `/api/v1/getOrder`).
- [ ] Apply standard HTTP methods accurately (`GET` read, `POST` create, `PUT` replace, `PATCH` update, `DELETE` remove).
- [ ] Enforce deterministic error bodies containing `code`, `message`, and `details`.
- [ ] Provide RFC-compliant cursor or limit/offset pagination for collection endpoints.
- [ ] Support idempotency keys (`Idempotency-Key` header) on mutating operations (`POST`, `PATCH`).

## Execution Rules
1. **Explicit Versioning:** Prefix API paths with major version indicators (e.g., `/api/v1/`).
2. **Standard Status Codes:** Return `200` (OK), `201` (Created), `204` (No Content), `400` (Bad Request), `401` (Unauthenticated), `403` (Forbidden), `404` (Not Found), `409` (Conflict), `422` (Unprocessable).
3. **Strict Request Validation:** Validate all incoming parameters against strict schemas before controller execution.
4. **Predictable Payloads:** Wrap successful responses in structured JSON envelopes or standard shapes.
5. **Contract Mock First:** Deliver concrete JSON sample payloads immediately for mock-driven frontend parallel work.
