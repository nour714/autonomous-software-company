# Security Audit Workflow & Anti-Patterns

## Full audit workflow

In full audit mode, follow all six phases in order:

1. **Reconnaissance** — map the source, trust boundaries, local build paths, companion selections, prior evidence, and initial deterministic coverage ledger with [RECONNAISSANCE.md](../RECONNAISSANCE.md).
2. **Coverage-led hunting waves** — assign isolated hunters from the ledger and collect structured candidate results with [HUNTING.md](../HUNTING.md), [ATTACK-CLASSES.md](../ATTACK-CLASSES.md), and the selected domain companions.
3. **Candidate validation** — consolidate fingerprints and give every candidate to a fresh source verifier as defined in [VALIDATION-AND-REPORTING.md](../VALIDATION-AND-REPORTING.md).
4. **Structured output** — write all final `confirmed`, `needs_validation`, and `rejected` records to `findings.json`; validate it with `report-schema.json` and `validate-findings.cjs`, and validate the coverage claim with `validate-coverage-ledger.cjs`.
5. **Independent record verification** — use fresh agents to verify final source claims and reconcile corrections or state changes.
6. **Target-neutral report** — derive `REPORT.md`, `FINDINGS-DETAIL.md`, and `NEEDS-VALIDATION.md` from the final records, with no live-probe instructions.

Do not end the run before one of exactly two terminal states: (a) all Phase 6 artifacts are written and both validators pass, or (b) `run_status: "incomplete"` is recorded with its exact reason and the gap is disclosed in the report. Never stop mid-phase.

## Anti-patterns

1. Checklist deviations presented as vulnerabilities.
2. Defense-in-depth advice with no reachable boundary violation.
3. Live or shared-environment testing where bounded local evidence is insufficient.
4. Guessing provider, proxy, browser, identity, or deployment behavior not present in source.
5. Treating intended same-principal authority or self-impact as a cross-boundary result.
6. Reporting a parser or runtime effect stronger than the observed effect.
7. Emitting prose-only hunter results that cannot be deduplicated or verified.
8. Re-reporting carried same-source prior confirmed records or using them as exemplars that anchor the hunt.
9. Assigning severity to `needs_validation` records.
10. Writing the report before independent verification or letting prose and JSON disagree.

## Merged DevSecOps & Audit Readiness Checklist
*(Consolidated from `security-auditor`)*
- **Scope & Threat Model**: Confirm authorization/scope, map assets and trust boundaries, and run STRIDE threat modeling + attack trees before deep hunting.
- **Defense-in-Depth & Auth**: Verify least privilege (RBAC/ABAC/ReBAC), OAuth 2.0/2.1 / OIDC / JWT validation, MFA on privileged paths, zero-trust boundaries, and fail-secure error handling.
- **DevSecOps Pipeline**: Integrate SAST, DAST, dependency scanning, SBOM generation (CycloneDX/SLSA), and vault-based secrets management with automated rotation.
- **Compliance & Incident Readiness**: Map findings against OWASP Top 10 / ASVS, regulatory controls (GDPR, HIPAA, SOC 2, PCI-DSS), and verify tamper-evident logging + residual risk sign-off.
- **Operational Safety**: Never run intrusive tests in production without written approval, and never expose secrets or PII in reports.
