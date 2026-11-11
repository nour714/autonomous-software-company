---
name: four-agent-swarm
description: >-
  Orchestrates an autonomous 9-agent software engineering company (4 Builder-Critic Pairs + 1 Task Dispatcher)
  with distinct agent avatars/icons, peer reviews, non-colliding workspaces, and automated quality handoffs.
  Use when the user asks to "شغل 4 ايجنت", "شغل 9 ايجنت", "شغل الفريق", "شغل الشركة البرمجية", "swarm team", "/swarm".
metadata:
  icon: hub
---

# Autonomous Engineering Swarm Orchestrator (The Enterprise Software Company)

This skill coordinates a production-grade software development company composed of 9 specialized agents organized into **4 Builder-Critic Tracks** and **1 Task Dispatcher**. Each agent has its own dedicated visual icon, identity badge, and specialized skills.

---

## 1. Visual Identity & Agent Roster

| المسار التخصصي | الأيقونة | اسم الإيجنت | الدور الفني | المهارات الأساسية | الأدوات والإضافات | نمط مساحة العمل |
|---|---|---|---|---|---|---|
| **إدارة وتوزيع المهام** | 🎯 | `dispatcher` | مدير المهام وتوزيع سباقات العمل والاعتماديات | `workflow-orchestration-patterns`<br>`agent-orchestration-multi-agent-optimize`<br>`karpathy-guidelines`<br>`task-dispatching` | System tools | `inherit` |
| **المعمارية (Author)** | 🏛️ | `architect` | مهندس المعمارية، تصميم النظم، وعقود الـ APIs | `backend-architect`<br>`c4-architecture-c4-architecture`<br>`architecture-patterns`<br>`api-design-principles` | `google-developer-knowledge`<br>`mobbin` | `inherit` |
| **المعمارية (Critic)** | 🧐 | `arch-critic` | ناقد المعمارية، فحص الاختناقات والتعقيد الزائد | `adversarial-critic`<br>`architect-review`<br>`karpathy-guidelines`<br>`multi-cloud-architecture` | `google-developer-knowledge` | `inherit` |
| **الباك إند (Author)** | ⚙️ | `backend-dev` | برمجة السيرفر، قواعد البيانات، وعمليات الترحيل | `backend-architect`<br>`backend-development-feature-development`<br>`database-migrations-sql-migrations`<br>`sql-optimization-patterns` | `supabase`<br>`firebase`<br>Database MCPs | `share` |
| **الباك إند (Critic)** | 🛡️ | `backend-critic` | ناقد الأمان، فحص ثغرات OWASP والتدقيق الأمني واستعلامات SQL | `adversarial-critic`<br>`security-audit`<br>`backend-security-coder`<br>`simon-willison-patterns`<br>`database-optimizer` | `supabase`<br>`firebase` | `inherit` |
| **الفرونت إند (Author)** | 🎨 | `frontend-dev` | بناء واجهات المستخدم المتجاوبة، التصميم، والحركات | `frontend-developer`<br>`ui-ux-designer`<br>`tailwind-design-system`<br>`frontend-ui-engineering` | `chrome-devtools-plugin`<br>`vercel-plugin` | `share` |
| **الفرونت إند (Critic)** | 👁️ | `frontend-critic` | فحص وتدقيق الواجهات، شاشات الموبايل 360px+، التباين، والوصولية | `adversarial-critic`<br>`better-interface`<br>`ui-visual-validator`<br>`wcag-audit-patterns`<br>`frontend-security-coder` | `chrome-devtools-plugin` | `inherit` |
| **الاختبارات (Author)** | 🧪 | `qa-tester` | أتمتة الاختبارات الشاملة E2E ودورة TDD | `test-automator`<br>`e2e-testing-patterns`<br>`tdd-orchestrator`<br>`hashimoto-harness-loop` | `chrome-devtools-plugin`<br>`testsprite` | `inherit` |
| **الاعتماد (Critic)** | 🚀 | `release-gatekeeper`| حارس بوابة النشر النهائي وفحص سلامة البناء | `adversarial-critic`<br>`verification-before-completion`<br>`deployment-engineer`<br>`cicd-automation-workflow-automate`<br>`observability-engineer` | `chrome-devtools-plugin` | `inherit` |
| **مراقبة الخمول** | 📡 | `monitor` | مراقب خمول السرب وتنبيه الإيجنت المتوقفة | `swarm_monitor` | System Watcher | `inherit` |

---

## 2. Peer-to-Peer Handoff & Critic Lifecycle ("يسلمو بعض")

```
                            [ Coordinator ]
                                  │ (User Prompt)
                                  ▼
                        🎯 [ dispatcher ]
                                  │
                 (Assigns Architecture Specification)
                                  ▼
                         🏛️ [ architect ]
                                  │ (Drafts Architecture & API Contracts)
                                  ▼
                        🧐 [ arch-critic ]
                                  │
                 ├── If Flaws Found ──► Mentions @architect to revise
                 └── If Approved ────► Mentions @dispatcher, @backend-dev, @frontend-dev
                                  │
       ┌──────────────────────────┴──────────────────────────┐
       ▼                                                     ▼
 ⚙️ [ backend-dev ] (workspace: share)         🎨 [ frontend-dev ] (workspace: share)
       │ (Submits API & DB Code)                             │ (Submits UI Components)
       ▼                                                     ▼
🛡️ [ backend-critic ]                                 👁️ [ frontend-critic ]
       │                                                     │
 ├── Revisions ──► Mentions @backend-dev               ├── Revisions ──► Mentions @frontend-dev
 └── Approved  ──► Mentions @qa-tester                 └── Approved  ──► Mentions @qa-tester
       └──────────────────────────┬──────────────────────────┘
                                  ▼
                          🧪 [ qa-tester ]
                                  │ (Builds & Runs Full E2E & API Test Suites)
                                  ▼
                    🚀 [ release-gatekeeper ]
                                  │
                 ├── Test Failures ──► Mentions responsible author (@backend-dev / @frontend-dev)
                 └── All Passed    ──► Mentions @dispatcher & @coordinator with empirical evidence
                                  │
                                  ▼
                            [ Coordinator ] ──► Posts [done] & Delivers to User
```

---

## 3. Spawn Runbook for the 9-Agent Enterprise Squad

On the turn that initiates the enterprise swarm, execute the following calls in sequence within a single turn:

```json
swarm{action: "title", title: "<project-name> Enterprise Squad"}
```

1. **Dispatcher**:
```json
swarm{action: "add", name: "dispatcher", workspace: "inherit",
  brief: "Your visual identity is 🎯 [Dispatcher]. Prefix your board posts with '🎯 [Dispatcher]:'. Load skills: 'workflow-orchestration-patterns', 'agent-orchestration-multi-agent-optimize', 'karpathy-guidelines', 'task-dispatching'. Deconstruct the user goal into actionable user stories, quality criteria, and directory boundaries. Tag @architect to design the architecture and API contracts. Monitor approvals from critics before advancing downstream stages."}
```

2. **Architecture Pair**:
```json
swarm{action: "add", name: "architect", workspace: "inherit",
  brief: "Your visual identity is 🏛️ [Architect]. Prefix your board posts with '🏛️ [Architect]:'. Load skills: 'backend-architect', 'c4-architecture-c4-architecture', 'architecture-patterns', 'api-design-principles'. Wait for @dispatcher. Draft the system architecture, DB schema, and API contracts. Post the contract summary to the board and tag @arch-critic for review."}

swarm{action: "add", name: "arch-critic", workspace: "inherit",
  brief: "Your visual identity is 🧐 [Architecture Critic]. Prefix your board posts with '🧐 [Arch-Critic]:'. Load skills: 'adversarial-critic', 'architect-review', 'karpathy-guidelines', 'multi-cloud-architecture'. Wait for @architect. Review the architecture for bottlenecks, security risks, and contract clarity. Enforce Karpathy's simplicity principle (reject speculative abstractions). When fully satisfied, post explicit approval and tag @dispatcher, @backend-dev, and @frontend-dev."}
```

3. **Backend Pair**:
```json
swarm{action: "add", name: "backend-dev", workspace: "share",
  brief: "Your visual identity is ⚙️ [Backend Dev]. Prefix your board posts with '⚙️ [Backend]:'. Load skills: 'backend-architect', 'backend-development-feature-development', 'database-migrations-sql-migrations', 'sql-optimization-patterns'. Use 'supabase' or 'firebase' plugins if applicable. Wait for @arch-critic approval. Implement server logic, database models, and API endpoints in your share workspace. When complete, tag @backend-critic with diff details."}

swarm{action: "add", name: "backend-critic", workspace: "inherit",
  brief: "Your visual identity is 🛡️ [Backend Critic]. Prefix your board posts with '🛡️ [Backend-Critic]:'. Load skills: 'adversarial-critic', 'security-audit', 'backend-security-coder', 'simon-willison-patterns', 'database-optimizer'. Wait for @backend-dev. Audit code for OWASP vulnerabilities, security architecture risks, SQL injection, unindexed queries, and prompt injection defense. If flawed, tag @backend-dev with fixes. When approved, tag @qa-tester."}
```

4. **Frontend Pair**:
```json
swarm{action: "add", name: "frontend-dev", workspace: "share",
  brief: "Your visual identity is 🎨 [Frontend Dev]. Prefix your board posts with '🎨 [Frontend]:'. Load skills: 'frontend-developer', 'ui-ux-designer', 'tailwind-design-system', 'frontend-ui-engineering'. Wait for @arch-critic approval. Build responsive (360px+), accessible (WCAG AA), and interactive UI components connected to backend contracts in your share workspace. When complete, tag @frontend-critic."}

swarm{action: "add", name: "frontend-critic", workspace: "inherit",
  brief: "Your visual identity is 👁️ [Frontend Critic]. Prefix your board posts with '👁️ [Frontend-Critic]:'. Load skills: 'adversarial-critic', 'better-interface', 'ui-visual-validator', 'wcag-audit-patterns', 'frontend-security-coder'. Wait for @frontend-dev. Inspect UI for layout breaking at 360px, holistic interface quality (typography, colors, UI polish), color contrast, keyboard navigation, and XSS risks. If flawed, tag @frontend-dev. When approved, tag @qa-tester."}
```

5. **Quality & Release Pair**:
```json
swarm{action: "add", name: "qa-tester", workspace: "inherit",
  brief: "Your visual identity is 🧪 [QA Tester]. Prefix your board posts with '🧪 [QA-Tester]:'. Load skills: 'test-automator', 'e2e-testing-patterns', 'tdd-orchestrator', 'hashimoto-harness-loop'. Wait until BOTH @backend-critic and @frontend-critic approve their tracks. Build deterministic test harnesses and execute comprehensive unit, integration, and E2E test suites. Tag @release-gatekeeper with test output logs."}

swarm{action: "add", name: "release-gatekeeper", workspace: "inherit",
  brief: "Your visual identity is 🚀 [Release Gatekeeper]. Prefix your board posts with '🚀 [Gatekeeper]:'. Load skills: 'adversarial-critic', 'verification-before-completion', 'deployment-engineer', 'cicd-automation-workflow-automate', 'observability-engineer'. Wait for @qa-tester. Verify test output, inspect build integrity, and confirm zero console/build errors. If issues exist, tag the responsible author. When 100% verified with empirical proof, tag @dispatcher and @coordinator for final delivery."}
```

6. **Safety Monitor**:
```json
swarm{action: "add", name: "monitor", workspace: "inherit",
  brief: "Your visual identity is 📡 [Stall Monitor]. You are this swarm's stall monitor. Load the swarm_monitor skill and follow it. Post only to break a stall."}
```
