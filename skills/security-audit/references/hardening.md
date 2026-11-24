# Multi-Layer Security Hardening Reference

Defense-in-depth workflow for coordinated security scanning, threat modeling, remediation, and controls implementation across application, infrastructure, and compliance boundaries.

## When to Use
- Running a coordinated security hardening program across app, infra, and CI/CD.
- Establishing layered defense-in-depth controls after threat modeling and scans.
- Prioritizing remediation from CVSS scores, exploitability, and business impact.

## Safety
- Never run intrusive tests in production without written approval.
- Ensure rollback plans and regression tests exist before applying invasive hardening controls.

---

## Phase 1: Comprehensive Security Assessment

1. **Initial Vulnerability Scanning** (`security-audit` / `backend-critic`):
   - Execute SAST (Semgrep/Bandit/ESLint), DAST (OWASP ZAP), dependency audit (`npm audit`/Trivy), and secrets detection (GitLeaks/TruffleHog).
   - Generate SBOM inventory and map exposures to OWASP Top 10 (2021) and CWEs.
2. **Threat Modeling & Risk Analysis** (`security-audit` / `arch-critic`):
   - Conduct STRIDE threat modeling, construct attack trees, map threats to business impact, and prioritize risks.
3. **Architecture Security Review** (`backend-architect` / `arch-critic`):
   - Evaluate service boundaries, data flow trust boundaries, zero-trust identity controls, encryption in transit/at rest, and network segmentation.

## Phase 2: Vulnerability Remediation

4. **Critical Vulnerability Fixes** (`backend-dev` / `frontend-dev`):
   - Patch CVSS 7+ issues: parameterized queries for SQLi, output encoding/sanitization for XSS, strict session/auth checks, safe deserialization.
   - Require a failing-before / passing-after regression test for every accepted fix.
5. **Backend Security Hardening** (`backend-security-coder`):
   - Strict schema input validation, rate limiting/DDoS protection, OAuth2/JWT signature & claim verification, TLS 1.3 / AES-256 encryption, PII-free structured logging.
6. **Frontend Security Hardening** (`frontend-security-coder`):
   - Nonce-based CSP headers, DOMPurify HTML sanitization, PKCE OAuth2 flows, Subresource Integrity (SRI), and `HttpOnly` / `Secure` / `SameSite` cookies.
7. **Mobile Security Hardening** (when applicable):
   - Certificate pinning, encrypted local storage, secure IPC, obfuscation, and tamper/root detection.

## Phase 3: Security Controls Implementation

8. **Authentication & Authorization** (`security-audit`):
   - OAuth 2.0/2.1 / OIDC with PKCE, MFA (TOTP/WebAuthn/FIDO2), RBAC/ABAC/ReBAC least privilege, and token rotation.
9. **Infrastructure Security Controls** (`deployment-engineer`):
   - WAF rules, network micro-segmentation, cloud security groups/NACLs, Kubernetes Pod Security Standards & NetworkPolicies.
10. **Secrets Management** (`deployment-engineer`):
    - Vault/Cloud Secrets Manager integration, automated secret rotation, least-privilege IAM roles, zero hardcoded credentials.

## Phase 4: Validation & Compliance

11. **Penetration Testing & Validation** (`security-audit` / `qa-tester`):
    - Verify remediation effectiveness against auth bypass, IDOR, injection, and privilege escalation paths using bounded local harnesses.
12. **Compliance & Standards Verification**:
    - Validate controls against OWASP ASVS Level 2, CIS Benchmarks, SOC 2 Type II, GDPR/CCPA, HIPAA, or PCI-DSS where applicable.
13. **Security Monitoring & Incident Response** (`observability-engineer`):
    - Structured audit event correlation, anomaly alerts, and documented incident response playbooks.

## Exit Criteria
- All critical/high findings verified fixed with passing regression tests.
- SBOM generated and dependency vulnerabilities triaged.
- Secrets managed exclusively via runtime secret stores / environment boundaries.
- Security regression gates integrated into CI/CD pipelines.
