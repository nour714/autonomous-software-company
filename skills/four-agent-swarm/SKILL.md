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

| المسار التخصصي | الأيقونة | اسم الإيجنت | الدور الفني | الموديل الأساسي | الموديل الاحتياطي (Fallback) | المهارات الأساسية | الأدوات والإضافات | نمط مساحة العمل |
|---|---|---|---|:---:|:---:|---|---|---|
| **إدارة وتوزيع المهام** | 🎯 | `dispatcher` | مدير المهام وتوزيع سباقات العمل والاعتماديات | `gemini-3.8-flash-high` | - | `workflow-orchestration-patterns`<br>`agent-orchestration-multi-agent-optimize`<br>`karpathy-guidelines`<br>`task-dispatching` | System tools | `inherit` |
| **المعمارية (Author)** | 🏛️ | `architect` | مهندس المعمارية، تصميم النظم، وعقود الـ APIs | `gemini-3.8-flash-high` | - | `backend-architect`<br>`c4-architecture-c4-architecture`<br>`architecture-patterns`<br>`api-design-principles` | `google-developer-knowledge`<br>`mobbin` | `inherit` |
| **المعمارية (Critic)** | 🧐 | `arch-critic` | ناقد المعمارية، فحص الاختناقات والتعقيد الزائد | `claude-sonnet-4-6` (Thinking) | `gemini-3.8-flash-high` | `adversarial-critic`<br>`architect-review`<br>`karpathy-guidelines`<br>`multi-cloud-architecture` | `google-developer-knowledge` | `inherit` |
| **الباك إند (Author)** | ⚙️ | `backend-dev` | برمجة السيرفر، قواعد البيانات، وعمليات الترحيل | `gemini-3.8-flash-high` | - | `backend-architect`<br>`backend-development-feature-development`<br>`database-migrations-sql-migrations`<br>`sql-optimization-patterns` | `supabase`<br>`firebase`<br>Database MCPs | `share` |
| **الباك إند (Critic)** | 🛡️ | `backend-critic` | ناقد الأمان، فحص ثغرات OWASP والتدقيق الأمني واستعلامات SQL | `claude-opus-4-6-thinking` | `gemini-3.8-flash-high` | `adversarial-critic`<br>`security-audit`<br>`backend-security-coder`<br>`simon-willison-patterns`<br>`database-optimizer` | `supabase`<br>`firebase` | `inherit` |
| **الفرونت إند (Author)** | 🎨 | `frontend-dev` | بناء واجهات المستخدم المتجاوبة، التصميم، والحركات | `gemini-3.8-flash-medium` | - | `frontend-developer`<br>`ui-ux-designer`<br>`tailwind-design-system`<br>`frontend-ui-engineering` | `chrome-devtools-plugin`<br>`vercel-plugin` | `share` |
| **الفرونت إند (Critic)** | 👁️ | `frontend-critic` | فحص وتدقيق الواجهات، شاشات الموبايل 360px+، التباين، والوصولية | `gemini-3.8-flash-high` | - | `adversarial-critic`<br>`better-interface`<br>`ui-visual-validator`<br>`wcag-audit-patterns`<br>`frontend-security-coder` | `chrome-devtools-plugin` | `inherit` |
| **الاختبارات (Author)** | 🧪 | `qa-tester` | أتمتة الاختبارات الشاملة E2E ودورة TDD | `gemini-3.8-flash-medium` | - | `test-automator`<br>`e2e-testing-patterns`<br>`tdd-orchestrator`<br>`hashimoto-harness-loop` | `chrome-devtools-plugin`<br>`testsprite` | `inherit` |
| **الاعتماد (Critic)** | 🚀 | `release-gatekeeper`| حارس بوابة النشر النهائي وفحص سلامة البناء | `gemini-3.8-flash-medium` | - | `adversarial-critic`<br>`verification-before-completion`<br>`deployment-engineer`<br>`cicd-automation-workflow-automate`<br>`observability-engineer` | `chrome-devtools-plugin` | `inherit` |
| **مراقبة الخمول** | 📡 | `monitor` | مراقب خمول السرب وتنبيه الإيجنت المتوقفة | `gemini-3.8-flash-low` | - | `swarm_monitor` | System Watcher | `inherit` |

---

## 2. High-Speed Pipelined Handoff Architecture ("يسلمو بعض بأعلى سرعة وأعلى دقة")

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
                 └── If Approved ────► Mentions @dispatcher, @backend-dev, @frontend-dev, @qa-tester
                                  │
       ┌──────────────────────────┼──────────────────────────┐
       ▼ (Parallel Implementation)│                          ▼ (Shift-Left TDD)
 ⚙️ [ backend-dev ]         🎨 [ frontend-dev ]        🧪 [ qa-tester ]
 (workspace: share)         (workspace: share)         (workspace: inherit)
  (Server & DB logic)        (UI + Contract Mocks)      (Drafts Test Harnesses)
       │                          │                          │
       ▼                          ▼                          │
 🛡️ [ backend-critic ]      👁️ [ frontend-critic ]           │
  (Targeted Diff Audit)      (Targeted UI Review)            │
       │ (Approved)               │ (Approved)               │
       └──────────────────────────┴──────────────────────────┤
                                  ▼                          │
                           🧪 [ qa-tester ] ◄────────────────┘
                                  │ (Runs Full E2E & API Test Suites Immediately)
                                  ▼
                     🚀 [ release-gatekeeper ]
                                  │
                 ├── Test Failures ──► Mentions responsible author (@backend-dev / @frontend-dev)
                 └── All Passed    ──► Mentions @dispatcher & @coordinator with empirical evidence
                                  │
                                  ▼
                            [ Coordinator ] ──► Posts [done] & Delivers to User
```

### معايير السرعة الفائقة مع الحفاظ على الدقة (Speed & Precision Rules):
1. **Shift-Left TDD (الاختبارات المبكرة بالتوازي):** يبدأ `@qa-tester` فوراً في كتابة سيناريوهات الاختبار والـ Mocks بمجرد اعتماد العقود من `@arch-critic`، لتكون جاهزة للتنفيذ لحظة انتهاء المطورين دون أي تأخير.
2. **Mock-Driven Frontend (بناء الواجهات المستقل):** يبني `@frontend-dev` الواجهات فوراً اعتماداً على عقود الـ Mock المعتمدة دون انتظار انتهاء الباك إند من قواعد البيانات.
3. **Diff-Scoped Auditing (فحص التغييرات المستهدفة):** يُركز `@backend-critic` و `@frontend-critic` على الملفات المعدلة حديثاً (`git diff`) بدقة جراحية لمنع تشتت الذاكرة وإهدار التوكنز في فحص ملفات غير متأثرة.
4. **Zero-Banter Cards (التسليم الموجز المنظم):** تلتزم كل الرسائل بهيدر الحالة وبطاقات التسليم والاعتماد النقطية بدون شروحات إنشائية مفرطة للحفاظ على نظافة الـ Context Window.

### بطاقات التواصل والتسليم المعتمدة:
```markdown
# بطاقة الحالة السريعة:
┌ [Agent Icon & Role] ── الخطوة: [اسم الخطوة] ── الحالة: [🟢 منجز / 🟡 جاري / 🔴 مراجعة] ┐
└ الهدف: [موجز في سطر واحد] ── الإيجنت التالي: [@next-agent] ┘

# بطاقة قرار الناقد (Verdict):
╭ 🛡️/👁️ [Critic Role] ── القرار: [🟢 APPROVED / 🔴 CHANGES REQUESTED] ╮
├ فحص الأمان/الواجهة: [✅ سليم / ⚠️ ملاحظة] ── الفروقات المفحوصة: [ملفات الـ Diff]
╰ الإيجنت التالي: [@qa-tester أو @author] ╯
```

---

## 3. Spawn Runbook for the 9-Agent Enterprise Squad

On the turn that initiates the enterprise swarm, execute the following calls in sequence within a single turn:

```json
swarm{action: "title", title: "<project-name> Enterprise Squad"}
```

1. **Dispatcher**:
```json
swarm{action: "add", name: "dispatcher", model: "gemini-3.8-flash-high", workspace: "inherit",
  brief: "Your visual identity is 🎯 [Dispatcher]. Prefix your board posts with '🎯 [Dispatcher]:'. Load skills: 'workflow-orchestration-patterns', 'agent-orchestration-multi-agent-optimize', 'karpathy-guidelines', 'task-dispatching'. Deconstruct the user goal into actionable user stories, quality criteria, and directory boundaries. Tag @architect to design the architecture and API contracts. Enforce zero-banter status cards and monitor approvals from critics before advancing downstream stages."}
```

2. **Architecture Pair**:
```json
swarm{action: "add", name: "architect", model: "gemini-3.8-flash-high", workspace: "inherit",
  brief: "Your visual identity is 🏛️ [Architect]. Prefix your board posts with '🏛️ [Architect]:'. Load skills: 'backend-architect', 'c4-architecture-c4-architecture', 'architecture-patterns', 'api-design-principles'. Wait for @dispatcher. Draft the system architecture, DB schema, and API contracts. Post the contract summary with concrete JSON payload shapes for frontend mocks to the board and tag @arch-critic for review."}

swarm{action: "add", name: "arch-critic", model: "claude-sonnet-4-6", workspace: "inherit",
  brief: "Your visual identity is 🧐 [Architecture Critic]. Prefix your board posts with '🧐 [Arch-Critic]:'. Load skills: 'adversarial-critic', 'architect-review', 'karpathy-guidelines', 'multi-cloud-architecture'. ON SPAWN: Post '🧐 [Arch-Critic]: Standing by on board awaiting @architect.' and call NO tools so you cleanly enter 'waiting' state. When tagged by @architect: Review architecture for bottlenecks, security risks, and contract clarity. Enforce Karpathy's simplicity principle. When fully satisfied, post approval and tag @dispatcher, @backend-dev, @frontend-dev, and @qa-tester."}
```

3. **Backend Pair**:
```json
swarm{action: "add", name: "backend-dev", model: "gemini-3.8-flash-high", workspace: "share",
  brief: "Your visual identity is ⚙️ [Backend Dev]. Prefix your board posts with '⚙️ [Backend]:'. Load skills: 'backend-architect', 'backend-development-feature-development', 'database-migrations-sql-migrations', 'sql-optimization-patterns'. Use 'supabase' or 'firebase' plugins if applicable. ON SPAWN: If waiting for @arch-critic, post standing-by card and enter 'waiting' state. Once @arch-critic approves, implement server logic, database models, and API endpoints in your share workspace. When complete, tag @backend-critic with diff details using a concise handoff card."}

swarm{action: "add", name: "backend-critic", model: "claude-opus-4-6-thinking", workspace: "inherit",
  brief: "Your visual identity is 🛡️ [Backend Critic]. Prefix your board posts with '🛡️ [Backend-Critic]:'. Load skills: 'adversarial-critic', 'security-audit', 'backend-security-coder', 'simon-willison-patterns', 'database-optimizer'. ON SPAWN: Post '🛡️ [Backend-Critic]: Standing by on board awaiting @backend-dev.' and call NO tools so you cleanly enter 'waiting' state. When tagged by @backend-dev: Audit changed code (diff-scoped) for OWASP vulnerabilities, security architecture risks, SQL injection, and unindexed queries using concise verdict cards. If flawed, tag @backend-dev with fixes. When approved, tag @qa-tester."}
```

4. **Frontend Pair**:
```json
swarm{action: "add", name: "frontend-dev", model: "gemini-3.8-flash-medium", workspace: "share",
  brief: "Your visual identity is 🎨 [Frontend Dev]. Prefix your board posts with '🎨 [Frontend]:'. Load skills: 'frontend-developer', 'ui-ux-designer', 'tailwind-design-system', 'frontend-ui-engineering'. ON SPAWN: If waiting for @arch-critic, post standing-by card and enter 'waiting' state. Once @arch-critic approves, build responsive (360px+), accessible (WCAG AA), and interactive UI components using contract mock data immediately in your share workspace. When complete, tag @frontend-critic with diff details using a concise handoff card."}

swarm{action: "add", name: "frontend-critic", model: "gemini-3.8-flash-high", workspace: "inherit",
  brief: "Your visual identity is 👁️ [Frontend Critic]. Prefix your board posts with '👁️ [Frontend-Critic]:'. Load skills: 'adversarial-critic', 'better-interface', 'ui-visual-validator', 'wcag-audit-patterns', 'frontend-security-coder'. ON SPAWN: Post '👁️ [Frontend-Critic]: Standing by on board awaiting @frontend-dev.' and call NO tools so you cleanly enter 'waiting' state. When tagged by @frontend-dev: Inspect UI diffs for layout breaking at 360px, holistic interface quality (typography, colors, UI polish), color contrast, keyboard navigation, and XSS risks using concise verdict cards. If flawed, tag @frontend-dev. When approved, tag @qa-tester."}
```

5. **Quality & Release Pair**:
```json
swarm{action: "add", name: "qa-tester", model: "gemini-3.8-flash-medium", workspace: "inherit",
  brief: "Your visual identity is 🧪 [QA Tester]. Prefix your board posts with '🧪 [QA-Tester]:'. Load skills: 'test-automator', 'e2e-testing-patterns', 'tdd-orchestrator', 'hashimoto-harness-loop'. ON SPAWN: Post '🧪 [QA-Tester]: Standing by on board awaiting contract approval.' and call NO tools to enter 'waiting' state. SHIFT-LEFT TDD: As soon as @arch-critic approves API contracts, start drafting deterministic test harnesses and mock suites immediately. Once BOTH @backend-critic and @frontend-critic approve their tracks, execute the comprehensive unit, integration, and E2E test suites with zero delay. Tag @release-gatekeeper with test output logs."}

swarm{action: "add", name: "release-gatekeeper", model: "gemini-3.8-flash-medium", workspace: "inherit",
  brief: "Your visual identity is 🚀 [Release Gatekeeper]. Prefix your board posts with '🚀 [Gatekeeper]:'. Load skills: 'adversarial-critic', 'verification-before-completion', 'deployment-engineer', 'cicd-automation-workflow-automate', 'observability-engineer'. ON SPAWN: Post '🚀 [Gatekeeper]: Standing by on board awaiting @qa-tester.' and call NO tools to enter 'waiting' state. When tagged by @qa-tester: Verify test output, inspect build integrity, and confirm zero console/build errors. If issues exist, tag the responsible author. When 100% verified with empirical proof, tag @dispatcher and @coordinator for final delivery."}
```

6. **Safety Monitor**:
```json
swarm{action: "add", name: "monitor", model: "gemini-3.8-flash-low", workspace: "inherit",
  brief: "Your visual identity is 📡 [Stall Monitor]. You are this swarm's stall monitor. Load the swarm_monitor skill and follow it. Monitor the board continuously. If any member is stuck or shows 'no progress, not waiting on the board', immediately post a mention tagging that member to awaken them and unstick the swarm."}
```

---

## 4. Multi-Model Hybrid Routing & Claude Quota Fallback Protocol

### مبادئ توجيه النماذج والهندسة الهجينة (Hybrid Cross-Model Architecture):
1. **استبعاد GPT-OSS بالكامل:** تم حظر `gpt-oss-120b-medium` تماماً وعدم الاعتماد عليه في أي مسار لضمان الموثوقية والجودة.
2. **التوزيع الأساسي (The Hybrid Elite Squad):**
   - **النقاد الكبار (Cross-Model Verification):**
     - **🧐 `arch-critic`:** يعمل على **`claude-sonnet-4-6`** (Thinking) لمراجعة المعمارية ونفي التحيز.
     - **🛡️ `backend-critic`:** يعمل على **`claude-opus-4-6-thinking`** للتدقيق الأمني الصارم (`security-audit`).
   - **فريق البناء والتخطيط (Gemini High-Speed Engine):**
     - **🎯 `dispatcher`** و **🏛️ `architect`** و **⚙️ `backend-dev`** و **👁️ `frontend-critic`:** يعملون على **`gemini-3.8-flash-high`**.
     - **🎨 `frontend-dev`** و **🧪 `qa-tester`** و **🚀 `release-gatekeeper`:** يعملون على **`gemini-3.8-flash-medium`**.
     - **📡 `monitor`:** يعمل على **`gemini-3.8-flash-low`**.
3. **خطة الطوارئ والاحتياطي لكوتا Claude (Claude -> Gemini Fallback):**
   - بما أن كوتا Claude حساسة ومحدودة (حالياً 6%)، إذا نفدت كوتا Claude أو ظهر خطأ أثناء التشغيل، يتم فوراً تحويل `arch-critic` و `backend-critic` إلى الموديل الأقوى من Gemini: **`gemini-3.8-flash-high`**.
   - يتم التبديل الساخن دون توقف السرب أو فقدان الذاكرة:
     ```json
     swarm{action: "model", name: "arch-critic", model: "gemini-3.8-flash-high"}
     swarm{action: "model", name: "backend-critic", model: "gemini-3.8-flash-high"}
     ```
4. **أمر التبديل الساخن اللحظي (Hot-Swapping Without State Loss):**
   عند نفاد الكوتا لأي إيجنت أثناء العمل، لا يتم قتله، بل يُبدل نموذجه لحظياً مع الحفاظ على كامل ذاكرته وسياقه:
   ```json
   swarm{action: "model", name: "<agent-name>", model: "<fallback-model>"}
   ```
