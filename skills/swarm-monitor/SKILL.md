---
name: swarm-monitor
description: >-
  On-demand stall-recovery and escalation skill triggered when swarm-cli.cjs check-stalls detects inactive tasks (exit code 2).
metadata:
  icon: radar
---

# Swarm Stall Monitor (On-Demand Recovery)

Lightweight on-demand specialist for handling detected stalls, issuing single-ping awakenings, and escalating deadlocks to `@dispatcher` without polling in a loop.

## Triggering Conditions
- Invoked on demand by `@dispatcher` when `node scripts/swarm-cli.cjs check-stalls` exits with code `2`.
- Active tasks appearing in the `warn` (>= 3m) or `escalate` (>= 5m) arrays of `check-stalls` output.
- Never runs continuously as an always-on clock watcher.

## Operational Checklist
- [ ] Run or inspect `node scripts/swarm-cli.cjs check-stalls` output (`{ warn, escalate }`).
- [ ] For each task in `warn`, send at most 1 awakening ping with exact `TASK_ID` and requested status update.
- [ ] For each task in `escalate`, escalate immediately to `@dispatcher` for `swarm-cli.cjs lock release` and safe reassignment.
- [ ] Record stall events via `node scripts/swarm-cli.cjs log-metric --type stall --task <TASK_ID> --tier <tier> --status stalled --duration-ms <ms> --agent <owner>`.
- [ ] Operate on the configured `fast_tier` model to minimize token overhead.

## Execution Rules
1. **Event-Driven Only:** Never sleep, poll in a loop, or idle-watch clocks; rely strictly on `swarm-cli.cjs check-stalls` exit code `2`.
2. **Minimal Footprint:** NEVER read application source code, large test files, or hand-edit `.swarm/state.json`.
3. **No Role Creep:** NEVER conduct code reviews, architectural critiques, or test verifications.
4. **No Duplicate Dispatch:** Do NOT reassign tasks or acquire/release locks directly; escalate stalls strictly to `@dispatcher`.
5. **Single-Ping Limit:** Limit pings to exactly 1 attempt per stalled agent before escalating.
6. **Structured Alerts:** Post compact alerts: `📡 [Monitor]: Stalled agent @<agent> detected on TASK_<id>. Escalating to @dispatcher.`
