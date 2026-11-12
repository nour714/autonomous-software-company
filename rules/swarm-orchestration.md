# Multi-Agent Swarm Orchestration Rules

## 1. Squad Roster & Responsibilities
The autonomous engineering team operates as 4 specialized Builder-Critic tracks overseen by a Dispatcher:

1. 🎯 `dispatcher`: Requirement deconstruction and task allocation.
2. 🏛️ `architect` & 🧐 `arch-critic`: System design, interface definitions, and architectural review.
3. ⚙️ `backend-dev` & 🛡️ `backend-critic`: Server endpoints, data validation, database schemas, and security audits (`security-audit`).
4. 🎨 `frontend-dev` & 👁️ `frontend-critic`: Responsive user interfaces (360px+), accessibility (WCAG 2.1 AA), and comprehensive interface auditing (`better-interface`).
5. 🧪 `qa-tester` & 🚀 `release-gatekeeper`: Automated test suites, integration validation, and release gatekeeping.
6. 📡 `monitor`: Swarm stall detection.

## 2. Handoff Standards
- Workspaces for authors (`backend-dev`, `frontend-dev`) use shared copies (`workspace: "share"`) to eliminate file collisions.
- Peer-to-peer handoffs occur on the message board using `@mentions`.
- No feature is declared complete without automated verification evidence.

## 3. High-Speed & High-Precision Execution Standards
- **Shift-Left TDD:** `qa-tester` begins drafting deterministic test harnesses as soon as API contracts are approved by `arch-critic`, eliminating downstream waiting time.
- **Mock-Driven Parallelism:** `frontend-dev` builds UI against approved contract shapes immediately without blocking on backend database provisioning.
- **Diff-Scoped Audits:** `backend-critic` and `frontend-critic` focus review attention surgically on changed files (`git diff`) rather than rescanning untouched areas.
- **Zero-Banter Communication:** All status updates, handoffs, and critic verdicts use structured, concise cards to preserve context window hygiene and maximize execution speed.

## 4. Multi-Model Hybrid Routing & Claude Quota Defense
- **Zero GPT-OSS Dependency:** `gpt-oss-120b-medium` is strictly excluded from all tracks.
- **Hybrid Elite Critic Pairing:** `arch-critic` runs on `claude-sonnet-4-6` (Thinking) and `backend-critic` runs on `claude-opus-4-6-thinking` for cross-vendor adversarial verification.
- **Gemini Core Engine:** `dispatcher`, `architect`, `backend-dev`, and `frontend-critic` run on `gemini-3.8-flash-high`; `frontend-dev`, `qa-tester`, and `release-gatekeeper` on `gemini-3.8-flash-medium`; `monitor` on `gemini-3.8-flash-low`.
- **Claude -> Gemini Fallback Protocol:** If Claude quota (currently 6%) runs out or triggers a limit, immediately hot-swap `arch-critic` and `backend-critic` to `gemini-3.8-flash-high` via `swarm model` with zero downtime or context loss.
