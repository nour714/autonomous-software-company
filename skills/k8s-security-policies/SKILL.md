---

name: k8s-security-policies

description: Implement Kubernetes security policies including NetworkPolicy, Pod Security Admission, and RBAC for production-grade security. Use when securing Kubernetes clusters, implementing network isolation, or enforcing pod security standards.

---

# Kubernetes Security Policies

Comprehensive guide for implementing NetworkPolicy, RBAC, and Pod Security Standards (enforced by Pod Security Admission, which replaced PodSecurityPolicy in Kubernetes 1.25) in Kubernetes.

## Do not use this skill when

- The task is unrelated to kubernetes security policies

- You need a different domain or tool outside this scope

## Instructions

- Clarify goals, constraints, and required inputs.

- Apply relevant best practices and validate outcomes.

- Provide actionable steps and verification.

## Purpose

Implement defense-in-depth security for Kubernetes clusters using network policies, pod security standards, and RBAC.

## Use this skill when

- Implement network segmentation

- Configure pod security standards

- Set up RBAC for least-privilege access

- Create security policies for compliance

- Implement admission control

- Secure multi-tenant clusters

## Reference Documentation Index

Load these specialized references on-demand only when the task requires in-depth details:

- [Existing RBAC Patterns](references/rbac-patterns.md) — RBAC definitions and least-privilege role bindings.

- [Pod Security Standards & Network Policies](references/pod-security-and-network-policies.md) — Baseline/Restricted standards and micro-segmentation network policies.

- [RBAC & Security Context Guide](references/rbac-and-security-context.md) — Explicit non-root permissions, seccomp profiles, and drop capabilities.

- [OPA Gatekeeper, Istio & Compliance](references/opa-istio-and-compliance.md) — ConstraintTemplates, mutual TLS authentication, CIS benchmarks, and troubleshooting.
