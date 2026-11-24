# Security Requirement Extraction Reference

Methodology for deriving testable security requirements, user stories, acceptance criteria, and compliance traceability matrices from threat models (STRIDE) and business context.

## When to Use
- Translating threat models into concrete engineering requirements and user stories.
- Defining security acceptance criteria and regression test cases before implementation.
- Building threat-to-requirement and compliance traceability matrices.

---

## Core Flow

```text
Business Context / Threat Model (STRIDE)
  -> Security Requirements (Functional / Non-Functional / Constraints)
  -> Acceptance Criteria & Security Test Cases
  -> Traceability Matrix (Threat <-> Requirement <-> Control <-> Test)
```

### Requirement Types
- **Functional**: What the system must enforce (e.g., *"Verify JWT signature and expiration on all protected routes"*).
- **Non-Functional**: Performance/assurance bounds (e.g., *"Rate limit login attempts to 5/min per IP"*).
- **Constraint**: Architectural invariants (e.g., *"Use AES-256-GCM via managed KMS; zero hardcoded secrets"*).

---

## STRIDE-to-Requirement Mapping

| STRIDE Category | Security Domains | Standard Requirements & Acceptance Criteria |
|---|---|---|
| **Spoofing** | Authentication, Session Management | Authenticate principals before access; cryptographically verify tokens; enforce expiration & MFA for privileged roles; log auth failures. |
| **Tampering** | Input Validation, Data Protection | Validate all external inputs against strict schemas; verify integrity signatures; prevent SQLi/XSS/command injection. |
| **Repudiation** | Audit Logging | Log all security-relevant actions with actor, timestamp, and outcome; protect audit logs from modification; enforce retention rules. |
| **Information Disclosure** | Data Protection, Cryptography | Encrypt sensitive data in transit (TLS 1.2+/1.3) and at rest; restrict access via least privilege; sanitize error messages and logs (no secrets/PII). |
| **Denial of Service** | Availability, Input Validation | Enforce per-principal/IP rate limits and payload/timeout bounds; degrade gracefully under load; alert on resource exhaustion. |
| **Elevation of Privilege** | Authorization | Enforce server-side authorization checks on every resource operation (RBAC/ABAC + ownership check for IDOR); default deny; log privilege changes. |

---

## Security User Story & Test Template

```markdown
### SR-001: Enforce Server-Side Resource Ownership (IDOR Prevention)
- **Domain:** Authorization | **Priority:** Critical | **Threat Ref:** THREAT-ELEV-01
- **Requirement:** Every single-resource read/update/delete endpoint must verify `resource.owner_id === currentUser.id` (or explicit admin role) server-side.
- **Acceptance Criteria:**
  - [ ] Requests from non-owners return HTTP 403 Forbidden.
  - [ ] Attempted unauthorized access is recorded in the audit log.
- **Regression Test Case:**
  - Authenticate as User A, request User B's resource ID, assert status 403 and unchanged resource state.
- **Compliance Mapping:** OWASP ASVS V4.1, PCI-DSS 7.1, GDPR Art. 25.
```

---

## Best Practices
1. **Traceability**: Link every requirement back to a specific threat ID or compliance control.
2. **Testability**: Never write vague criteria like *"System must be secure"* — specify exact inputs, status codes, and invariants.
3. **Prioritization**: Rank by `Impact * Likelihood` so Critical/High threats drive immediate sprint blockers.
4. **Gap Detection**: Build a matrix checking that every STRIDE threat and compliance control maps to at least one implemented control and passing test.
