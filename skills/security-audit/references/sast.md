# Static Application Security Testing (SAST) Reference

Consolidated SAST guidance, multi-language tool configurations, vulnerability patterns, and CI/CD integration.

## Capabilities & Scope
- **Multi-language SAST**: Python, JavaScript/TypeScript, Java, Ruby, PHP, Go, Rust.
- **Tool integration**: Bandit, Semgrep, ESLint Security, SonarQube, CodeQL, PMD, SpotBugs, Brakeman, Gosec, Cargo Clippy.
- **Vulnerability patterns**: SQL injection, XSS, hardcoded secrets, path traversal, IDOR, CSRF, insecure deserialization, command injection, insecure random.
- **Safety**: Avoid uploading proprietary code to external services without approval; review before enabling auto-fix or blocking releases.

## Workflow
1. Identify languages, frameworks, and repository scan scope.
2. Select SAST tools and configure rule sets (including custom Semgrep rules).
3. Run scans locally or in CI with deterministic, JSON/SARIF output.
4. Triage findings against real trust boundaries, prioritize by severity, and propose minimal fixes + regression tests.

---

## Tool Selection & Configurations

### Python: Bandit
```bash
pip install bandit
bandit -r . -f json -o bandit-report.json
bandit -r . -ll -ii -f json  # High/Critical only
```
`.bandit`:
```yaml
exclude_dirs: ['/tests/', '/venv/', '/.tox/', '/build/']
tests: [B201, B301, B302, B303, B304, B305, B307, B308, B312, B323, B324, B501, B502, B506, B602, B608]
skips: [B101]
```

### JavaScript/TypeScript: ESLint Security
```bash
npm install --save-dev eslint @eslint/plugin-security eslint-plugin-no-secrets
eslint . --ext .js,.jsx,.ts,.tsx --format json > eslint-security.json
```
Key ESLint rules: `security/detect-object-injection`, `security/detect-non-literal-fs-filename`, `security/detect-eval-with-expression`, `security/detect-pseudo-random-prng`, `no-secrets/no-secrets`.

### Multi-Language: Semgrep
```bash
semgrep --config=auto --json --output=semgrep-report.json
semgrep --config=p/security-audit --json
semgrep --config=p/owasp-top-ten --json
semgrep ci --config=auto
```
Example `.semgrep.yml` custom rules:
```yaml
rules:
  - id: sql-injection-format-string
    pattern: cursor.execute("... %s ..." % $VAR)
    message: SQL injection via string formatting
    severity: ERROR
    languages: [python]
    metadata:
      cwe: "CWE-89"
      owasp: "A03:2021-Injection"

  - id: dangerous-innerHTML
    pattern: $ELEM.innerHTML = $VAR
    message: XSS via innerHTML assignment
    severity: ERROR
    languages: [javascript, typescript]
    metadata:
      cwe: "CWE-79"

  - id: command-injection
    patterns:
      - pattern-either:
          - pattern: os.system($CMD)
          - pattern: subprocess.call($CMD, shell=True)
    message: Command injection via shell=True
    severity: ERROR
    languages: [python]
```

### Other Languages
- **Java**: `mvn spotbugs:check`
- **Ruby**: `brakeman -o report.json -f json`
- **Go**: `gosec -fmt=json -out=gosec.json ./...`
- **Rust**: `cargo clippy -- -W clippy::unwrap_used`

---

## Core Vulnerability Patterns & Fixes

| Pattern | Vulnerable Example | Secure Pattern |
|---|---|---|
| **SQL Injection** | String interpolation in SQL | Parameterized queries / ORM (`cursor.execute("... %s", (id,))`) |
| **XSS** | `el.innerHTML = userInput` | `el.textContent = userInput` or `DOMPurify.sanitize(userInput)` |
| **Hardcoded Secrets** | `API_KEY = "sk-..."` | `os.environ.get('API_KEY')` via secret manager |
| **Path Traversal** | `open(os.path.join(BASE, req))` | Resolve `realpath()` and verify `startswith(realpath(BASE))` |
| **Insecure Deserialization** | `pickle.loads(data)` / `yaml.load(data)` | `json.loads(data)` / `yaml.safe_load(data)` |
| **Command Injection** | `subprocess.call(cmd, shell=True)` | Argument array `subprocess.run(['ping', '-c', '4', host])` |
| **Insecure Random** | `random.choice()` for tokens | `secrets.token_hex(16)` / `secrets.token_urlsafe(32)` |

### Framework Hardening Highlights
- **Django**: `DEBUG = False`, `SecurityMiddleware`, `CsrfViewMiddleware`, `XFrameOptionsMiddleware`, `SECURE_SSL_REDIRECT = True`, `SESSION_COOKIE_SECURE = True`, `CSRF_COOKIE_SECURE = True`.
- **Flask**: `debug = False`, env-sourced `secret_key`, `Talisman(app, force_https=True)`, strict `CORS(app, origins=[...])`.
- **Express.js**: `helmet()`, strict origin `cors({ origin: ... })`, `express-rate-limit`.

---

## CI/CD Integration & Best Practices
```yaml
name: SAST Scan
on:
  pull_request:
    branches: [main]
jobs:
  sast:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-python@v5
        with:
          python-version: '3.11'
      - name: Run scans
        run: |
          pip install bandit semgrep
          bandit -r . -f json -o bandit.json || true
          semgrep --config=auto --json --output=semgrep.json || true
```
- Combine multiple scanners and run in pre-commit + PR CI gates.
- Tune false positives with explicit baseline suppressions and verify every finding against reachable trust boundaries.
