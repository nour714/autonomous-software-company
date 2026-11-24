# Dependency Vulnerability Scanning & Supply Chain Reference

Cross-ecosystem dependency scanning, SBOM generation (CycloneDX), risk prioritization, and CI/CD automation.

## Use When
- Auditing project dependencies for known CVEs or restrictive licenses.
- Generating Software Bills of Materials (SBOM) for supply chain visibility.
- Planning safe upgrades and remediation for vulnerable packages.

## Safety
- Never run automated major upgrades (`npm audit fix --force`, etc.) without review and test verification.
- Treat every dependency update as release-impacting and run the full test suite afterward.

---

## Multi-Ecosystem Scan Commands

| Ecosystem | Manifest / Lockfile | Audit Command | Fix / Update Command |
|---|---|---|---|
| **Node.js (npm)** | `package.json`, `package-lock.json` | `npm audit --json` | `npm audit fix && npm test` |
| **Python** | `requirements.txt`, `pyproject.toml` | `pip-audit --format=json` / `safety check --json` | `pip-audit --fix && pytest` |
| **Go** | `go.mod` | `govulncheck -json ./...` | `go get -u ./... && go mod tidy && go test ./...` |
| **Rust** | `Cargo.toml` | `cargo audit --json` | `cargo update && cargo test` |

---

## Prioritization & SBOM Generation

### Risk Prioritization Criteria
Rank vulnerabilities using:
1. **CVSS Score & Severity**: Address `CRITICAL` and `HIGH` first.
2. **Exploitability**: Prioritize CVEs with known public exploits and reachable call paths in your codebase.
3. **Fix Availability**: Prefer non-breaking fixed versions (`fixed_in`); apply compensating controls/mitigations if upstream patch is unavailable.

### CycloneDX SBOM Structure
Emit components using standard Package URLs (`purl`):
```json
{
  "bomFormat": "CycloneDX",
  "specVersion": "1.5",
  "version": 1,
  "components": [
    {
      "type": "library",
      "name": "example-pkg",
      "version": "1.2.3",
      "purl": "pkg:npm/example-pkg@1.2.3"
    }
  ]
}
```

---

## CI/CD Dependency Gate Template

```yaml
name: Dependency Security Scan
on:
  push:
    branches: [main]
  schedule:
    - cron: '0 2 * * *'

jobs:
  scan-dependencies:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: NPM Audit
        if: hashFiles('package-lock.json') != ''
        run: |
          npm ci
          npm audit --audit-level=high
```

## Best Practices
1. Run dependency scans on every PR and daily via scheduled CI.
2. Commit lockfiles (`package-lock.json`, `Cargo.lock`, `go.sum`) for deterministic builds.
3. Verify checksums/provenance (SLSA) for critical release artifacts.
4. Maintain an approved license allowlist and flag copyleft conflicts early.
5. Create clean rollback branches before applying major dependency upgrades.
