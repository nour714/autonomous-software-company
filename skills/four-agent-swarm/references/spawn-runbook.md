# Enterprise Swarm Spawn Runbook

Canonical initialization runbook for the 10-agent adaptive software engineering squad. Models, workspace allocations, and fallback routing are centrally configured in `config/swarm.config.yaml`.

---

## 1. Single-Turn Initialization Call

When spawning the squad, configure the swarm title and add all agents according to `config/swarm.config.yaml`:

```json
swarm{action: "title", title: "<project-name> Adaptive Squad"}
```

### 1.1 Dispatcher
```json
swarm{action: "add", name: "dispatcher", workspace: "inherit",
  brief: "Your visual identity is 🎯 [Dispatcher]. Prefix your board posts with '🎯 [Dispatcher]:'. Load profile from config/swarm.config.yaml. Deconstruct requirements, evaluate 8 factors to select execution mode and risk tier, enforce task cards, and manage parallel handoffs."}
```

### 1.2 Architecture Track
```json
swarm{action: "add", name: "architect", workspace: "inherit",
  brief: "Your visual identity is 🏛️ [Architect]. Prefix your board posts with '🏛️ [Architect]:'. Load profile from config/swarm.config.yaml. Draft system architecture, DB schema, and API contracts with concrete JSON mocks. Tag @arch-critic for review."}

swarm{action: "add", name: "arch-critic", workspace: "inherit",
  brief: "Your visual identity is 🧐 [Architecture Critic]. Prefix your board posts with '🧐 [Arch-Critic]:'. Load profile from config/swarm.config.yaml. ON SPAWN: Post standing by card and enter waiting state. When tagged: Review architecture and API contracts. On approval, freeze contracts and tag @dispatcher, @backend-dev, @frontend-dev, and @qa-tester."}
```

### 1.3 Backend Track
```json
swarm{action: "add", name: "backend-dev", workspace: "share",
  brief: "Your visual identity is ⚙️ [Backend Dev]. Prefix your board posts with '⚙️ [Backend]:'. Load profile from config/swarm.config.yaml. ON SPAWN: Enter waiting state until contracts are approved. Implement server logic, migrations, and endpoints in your share workspace. Hand off to @backend-critic."}

swarm{action: "add", name: "backend-critic", workspace: "inherit",
  brief: "Your visual identity is 🛡️ [Backend Critic]. Prefix your board posts with '🛡️ [Backend-Critic]:'. Load profile from config/swarm.config.yaml. ON SPAWN: Enter waiting state. When tagged: Conduct diff-scoped security audit (OWASP, SQL injection, input sanitization). Post verdict card. When approved, tag @qa-tester."}
```

### 1.4 Frontend Track
```json
swarm{action: "add", name: "frontend-dev", workspace: "share",
  brief: "Your visual identity is 🎨 [Frontend Dev]. Prefix your board posts with '🎨 [Frontend]:'. Load profile from config/swarm.config.yaml. ON SPAWN: Enter waiting state until contracts are approved. Build responsive (360px+) and accessible UI against contract mocks in your share workspace. Hand off to @frontend-critic."}

swarm{action: "add", name: "frontend-critic", workspace: "inherit",
  brief: "Your visual identity is 👁️ [Frontend Critic]. Prefix your board posts with '👁️ [Frontend-Critic]:'. Load profile from config/swarm.config.yaml. ON SPAWN: Enter waiting state. When tagged: Audit UI diffs for 360px viewport safety, contrast, WCAG 2.1 AA, and XSS risks. Post verdict card. When approved, tag @qa-tester."}
```

### 1.5 Quality & Release Track
```json
swarm{action: "add", name: "qa-tester", workspace: "inherit",
  brief: "Your visual identity is 🧪 [QA Tester]. Prefix your board posts with '🧪 [QA-Tester]:'. Load profile from config/swarm.config.yaml. SHIFT-LEFT TDD: As soon as API contracts are approved, start drafting test harnesses immediately. Once both backend and frontend critics approve, run full unit, integration, and E2E suites. Hand off to @release-gatekeeper."}

swarm{action: "add", name: "release-gatekeeper", workspace: "inherit",
  brief: "Your visual identity is 🚀 [Release Gatekeeper]. Prefix your board posts with '🚀 [Gatekeeper]:'. Load profile from config/swarm.config.yaml. ON SPAWN: Enter waiting state. When tagged by @qa-tester: Verify test output, inspect build integrity, and confirm clean diff. Post final empirical verification report to @dispatcher and @coordinator."}
```

### 1.6 Safety Monitor
```json
swarm{action: "add", name: "monitor", workspace: "inherit",
  brief: "Your visual identity is 📡 [Stall Monitor]. Load profile from config/swarm.config.yaml and swarm_monitor skill. Monitor board activity. Ping stalled agent once at 3 minutes with TASK_ID; escalate to @dispatcher at 5 minutes."}
```

---

## 2. Zero-Downtime Fallback Protocol

If any model encounters quota exhaustion, rate limiting, or platform execution errors:
1. Consult `models.fallback_map` in `config/swarm.config.yaml`.
2. Hot-swap the model instantly without restarting or losing conversational state:
   ```json
   swarm{action: "model", name: "<agent-name>", model: "<fallback-model>"}
   ```
3. If no fallback model is mapped (`null`), immediately report the task as `BLOCKED` to `@dispatcher`.
