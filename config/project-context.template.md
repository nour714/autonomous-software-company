# Project Context Memory Template

Authoritative template and generator specification for `.swarm/project-context.md`.
All agents load this context at task start to maintain synchronized codebase understanding.

<!--
MEMORY SAFETY RULES:
1. VERIFIED COMMIT: Always include the verified Git commit hash (`git rev-parse HEAD`).
2. STALE DETECTION: If the current Git HEAD differs from the recorded commit, refresh this file before proceeding.
3. ZERO SECRET EXPOSURE: NEVER write API keys, service tokens, passwords, private endpoints, or .env values into this document.
-->

**Base Git Commit:** `{{GIT_COMMIT_HASH}}`
**Last Updated:** `{{ISO_TIMESTAMP}}`
**Managed By:** `@dispatcher`

---

## 1. Project Purpose
{{Concise summary of the application, business domain, and core problems solved.}}

## 2. Main Technology Stack
- **Primary Languages:** {{e.g., TypeScript, Python, Shell, PowerShell}}
- **Core Frameworks & Runtimes:** {{e.g., Node.js, Express, React, Next.js}}
- **Orchestration & AI Runtime:** Antigravity Autonomous Engineering Swarm (`config/swarm.config.yaml`)
- **Key Libraries:** {{e.g., Pytest, Vitest, Jest, Tailwind CSS}}

## 3. Repository Structure
- `config/`: Canonical swarm configuration and project context templates.
- `rules/`: Multi-agent governance and operational execution rules.
- `skills/`: Modular, lazy-loaded agent capabilities and technical references.
- `agents/`: Concise profile definitions and operating briefs for all 10 squad agents.
- `scripts/`: Operational tools, installation scripts, and performance reporting.
- `.swarm/`: Local, ephemeral swarm state, performance metrics, and project memory (gitignored).

## 4. Important Architectural Decisions
- **Canonical Swarm Config:** Single source of truth in `config/swarm.config.yaml` for models, fallback mappings, and numerical limits.
- **Lazy-Loaded Skills:** Core `SKILL.md` limited to $\le 80$ or $\le 120$ lines; deep references loaded on-demand.
- **Contract-First Streaming:** API contracts approved by `arch-critic` are frozen, unblocking parallel frontend mock building and shift-left TDD.
- **Zero Hardcoded Model IDs:** Model routing and fallback policies decouple orchestration rules from provider model version strings.

## 5. Main Application Modules
{{Key subsystem directories, bounded contexts, and service responsibilities.}}

## 6. API Contracts and Integration Boundaries
{{Primary REST endpoints, GraphQL schemas, RPC contracts, and mock payload shapes.}}

## 7. Database Technology and Key Entities
{{Relational / NoSQL database technologies, migration strategies, and core data models.}}

## 8. Development Commands
- Start dev server / environment: `{{DEV_COMMAND}}`
- Install dependencies: `{{INSTALL_COMMAND}}`

## 9. Build Commands
- Production build: `{{BUILD_COMMAND}}`

## 10. Test Commands
- Unit tests: `{{UNIT_TEST_COMMAND}}`
- Integration / E2E tests: `{{E2E_TEST_COMMAND}}`
- Coverage / validation: `{{VALIDATION_COMMAND}}`

## 11. Deployment Environment
{{Deployment targets, CI/CD pipeline details, and environment assumptions.}}

## 12. Important Technical Constraints
- Maximum 5 touched files per task unit.
- Maximum 2 review rounds per task.
- Execution Mode and Risk Tier are independent decisions.
- Single active writer per file in `.swarm/state.json`.

## 13. Critical Files and Ownership Rules
- `config/swarm.config.yaml`: Canonical configuration (owned exclusively by `@dispatcher`).
- `rules/swarm-orchestration.md`: Governance rules (owned exclusively by `@dispatcher`).
- `.swarm/state.json`: Ephemeral state registry (Dispatcher writes; all other agents read-only).
- `.swarm/metrics.jsonl`: Performance log (append-only by active agents).
- `.swarm/followups.md`: Deferred non-blocking findings (appended by critics).
- Tests & Fixtures: Owned exclusively by `@qa-tester`.
