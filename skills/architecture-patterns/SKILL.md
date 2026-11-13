---
name: architecture-patterns
description: >-
  Implement proven backend architecture patterns including Clean Architecture,
  Hexagonal Architecture, and Domain-Driven Design for scalable and decoupled systems.
metadata:
  icon: account_tree
---

# Architecture Patterns

Applies Clean, Hexagonal (Ports & Adapters), and Event-Driven architecture patterns to maintain separation of concerns and high testability.

## Triggering Conditions
- Designing new service components, domain modules, or bounded contexts.
- Decoupling domain business logic from infrastructure, databases, and third-party APIs.
- Resolving cyclic dependencies or untangling tight coupling between layers.

## Operational Checklist
- [ ] Define core domain entities and value objects free of framework dependencies.
- [ ] Specify explicit repository and adapter interfaces (ports) in the application layer.
- [ ] Keep outer infrastructure layers (HTTP, ORM, SDKs) dependent inward on core abstractions.
- [ ] Enforce dependency inversion: business rules never import infrastructure drivers.
- [ ] Separate command and query pipelines (CQRS) when read and write scale diverge.

## Execution Rules
1. **Dependency Direction:** Dependencies must only point inward toward the core domain.
2. **Ports & Adapters:** Define inbound ports for use cases and outbound ports for persistence/messaging.
3. **No Framework Leakage:** Domain entities must never extend ORM models or web framework base classes.
4. **Boundary Isolation:** Isolate subdomains into clear directories (`domain/`, `application/`, `infrastructure/`).
5. **Anti-Corruption Layer:** Translate external data formats at boundary boundaries via explicit mappers.
