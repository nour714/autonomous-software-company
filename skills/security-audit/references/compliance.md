# Regulatory Compliance & Audit Controls Reference

Guidance for mapping software engineering controls and audit logging to regulatory and assurance frameworks (GDPR, HIPAA, SOC 2, PCI-DSS).

## Safety & Scope Boundaries
- Technical controls support compliance readiness but do **not** replace formal legal counsel or independent third-party certification.
- Protect audit artifacts and never log raw PII, PHI, credentials, or payment card PAN/CVV values.

---

## Framework Control Matrix

| Framework | Scope | Core Technical Controls |
|---|---|---|
| **GDPR** | EU personal data privacy | Consent audit trail (explicit opt-in), data minimization, Article 17 erasure/anonymization workflow, Article 20 portability export (`JSON`/`CSV`), pseudonymization, 72h breach notification readiness. |
| **HIPAA** | US Protected Health Info (PHI) | Minimum-necessary RBAC/purpose verification, encryption at rest (AES-256) and in transit (TLS 1.2+/1.3), immutable PHI access audit logs, time-limited tokens, Business Associate Agreements (BAA). |
| **SOC 2** | Trust Services Criteria | CC6.1 logical access controls (MFA for admin/high-sensitivity actions, RBAC/least privilege), envelope encryption with KMS rotation, tamper-evident audit logging, availability/incident SLAs. |
| **PCI-DSS v4.0** | Payment cardholder data (CHD) | Zero storage of CVV/CVC/PIN; immediate processor tokenization; masked PAN display (last 4 only); Cardholder Data Environment (CDE) network segmentation; quarterly ASV/internal scans. |

---

## Implementation Patterns

### 1. Consent & Privacy by Design (GDPR)
- **Data minimization**: Store `password_hash`, `email`, and strictly required fields only; omit unrequested PII (DOB, SSN, phone, address).
- **Consent records**: Log `{ user_id, consent_type, granted, timestamp_utc, policy_version, method: "explicit_checkbox" }` in an append-only store; support revocation checks before processing.
- **Right to Erasure**: Verify user request token, purge profile data, anonymize user-generated content, schedule backup purge, notify downstream processors, and retain minimal non-PII erasure proof.

### 2. Tamper-Evident Audit Logging (SOC 2 / HIPAA)
Log security-critical events across:
- **Authentication**: `login_success`, `login_failure`, `logout`, `password_change`, `mfa_enabled/disabled`.
- **Authorization**: `access_granted`, `access_denied`, `role_assigned/revoked`, `permission_changed`.
- **Data & Privacy**: `data_viewed`, `data_exported`, `data_modified`, `data_deleted`, `consent_given/withdrawn`, `data_erasure`.

Include immutable fields (`id`, `timestamp_utc`, `actor_id`, `action`, `resource`, `outcome`) and chain entries using HMAC/SHA-256 integrity hashes when tamper-evidence is required.

### 3. Cardholder Data Protection (PCI-DSS)
- Never persist `cvv`, `cvv2`, `cvc2`, `cid`, or `pin`.
- Tokenize card inputs at the client/payment-gateway boundary so raw PANs never touch application databases or logs.
- Isolate payment services into segmented network zones with strict egress/ingress policies.

---

## Compliance Audit Output Checklist
1. **Applicability & Scope**: Applicable regulations and systems in scope.
2. **Gap Analysis**: Missing or weak controls mapped to specific articles/clauses.
3. **Technical Remediation**: Prioritized patches for encryption, auth, logging, and retention.
4. **Evidence Artifacts**: Verifiable config snapshots, test outputs, and CI check logs.
