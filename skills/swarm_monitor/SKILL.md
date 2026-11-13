---
name: swarm_monitor
description: >-
  Lightweight stall detection and activity monitoring agent skill for autonomous swarm operations.
metadata:
  icon: radar
---

# Swarm Stall Monitor

Lightweight supervisor for detecting stuck agents, communication deadlocks, and missed handoffs.

## Triggering Conditions
- Continuous execution during active swarm runs.
- Agents showing no activity on message board or `.swarm/state.json` heartbeats for > 3 minutes.
- Unacknowledged handoffs or deadlocked peer review tracks.

## Operational Checklist
- [ ] Inspect board messages, agent states, and `.swarm/state.json`.
- [ ] Track timestamp of latest turn or post from each active agent.
- [ ] Ping stalled agent once at 3 minutes of inactivity with exact `TASK_ID` and status request.
- [ ] Wait 2 additional minutes after ping; if still unresponsive, escalate directly to `@dispatcher`.
- [ ] Respect single active writer per file: Dispatcher manages lease revocation; Monitor never modifies leases or source files.
- [ ] Operate on the cheapest configured model (`gemini-3.8-flash-low`) to minimize resource consumption.

## Execution Rules
1. **Minimal Footprint:** NEVER read application source code, large test files, or bulky skill references.
2. **No Role Creep:** NEVER conduct code reviews, architectural critiques, or test verifications.
3. **No Duplicate Dispatch:** Do NOT reassign tasks or redefine scopes; escalate stalls strictly to `@dispatcher`.
4. **Single-Ping Limit:** Limit pings to exactly 1 attempt per stalled agent before triggering escalation.
5. **Structured Alerts:** Post compact alerts: `📡 [Monitor]: Stalled agent @<agent> detected on TASK_<id>. Escalating to @dispatcher.`
