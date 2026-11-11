# Multi-Agent Swarm Orchestration Rules

## 1. Squad Roster & Responsibilities
The autonomous engineering team operates as 4 specialized Builder-Critic tracks overseen by a Dispatcher:

1. 🎯 `dispatcher`: Requirement deconstruction and task allocation.
2. 🏛️ `architect` & 🧐 `arch-critic`: System design, interface definitions, and architectural review.
3. ⚙️ `backend-dev` & 🛡️ `backend-critic`: Server endpoints, data validation, database schemas, and security review.
4. 🎨 `frontend-dev` & 👁️ `frontend-critic`: Responsive user interfaces (360px+), accessibility (WCAG 2.1 AA), and design auditing.
5. 🧪 `qa-tester` & 🚀 `release-gatekeeper`: Automated test suites, integration validation, and release gatekeeping.
6. 📡 `monitor`: Swarm stall detection.

## 2. Handoff Standards
- Workspaces for authors (`backend-dev`, `frontend-dev`) use shared copies (`workspace: "share"`) to eliminate file collisions.
- Peer-to-peer handoffs occur on the message board using `@mentions`.
- No feature is declared complete without automated verification evidence.
