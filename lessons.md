# Agent-Ops Playbook — Lessons & Rules
> Source of truth: `docs/Agent-ops.md` · Generated: 2026-03-15

---

## Rule 0 — No Code Before Plan
For **every** feature, refactor, or bugfix > trivial:
1. Create `tasks/todo.md` with checkable steps + verification conditions + "Done when…" definition.
2. Human must review + approve plan → only then agents may edit files.
3. After changes → auto-verify (tests, typecheck, browser if applicable).
4. On failure / correction → append root cause here.

---

## 1. Plan Node Default (Mission Control First)
- Enter full plan mode for anything non-trivial (≥3 logical steps or architectural choice).
- Spawn **Planner Agent** → output `tasks/todo.md` with numbered, checkable items + verification conditions.
- If anything deviates / fails verification: **halt agents**, review logs + comments, re-plan. Never approve & continue blindly.

## 2. Subagent Strategy
- Spawn sub-agents liberally: Researcher, Code Writer, Test Runner, Browser Verifier, Terminal Executor.
- Keep Mission Control clean — offload exploration to dedicated agents.
- **One responsibility per agent** (do NOT give one agent 5 concerns — it degrades fast).
- For hard problems: spawn 2–3 parallel sub-agents → compare artifacts → pick/merge best path.
- Challenge every plan: *"Can this be done with 40% fewer agent handoffs?"*

## 3. Self-Improvement Loop
- After **ANY** correction / rejection / bad outcome:
  → Comment directly on the failing artifact.
  → Append the pattern to this file (`lessons.md`).
- Write ruthless, specific rules (e.g., "Never assume auth middleware exists — always verify via terminal first").
- Re-read this file at start of every new session / major task.

## 4. Verification Before Done
- **NEVER** mark task/mission complete without proving it works.
- Run: unit/integration tests + terminal verification + browser smoke test.
- Self-check: *"Would a staff/principal engineer at Google approve this diff right now?"*
- Treat artifact review like mandatory code review.

## 5. Demand Elegance (Balanced)
- If a fix feels hacky: **pause agents**, comment *"feels hacky — re-plan"*.
- Ask: *"Knowing everything we know now, is there a cleaner / more idiomatic way?"*
- Skip deep elegance hunt only for dead-obvious trivial fixes.

## 6. Autonomous Bug Fixing
- Bug / failing test / CI red → spawn **Debug Agent** with logs + test output.
- Let it iterate autonomously (plan → repro → fix → verify).
- Zero context-switch from user unless agents stuck after 2–3 self-corrections.

---

## Core Principles
| Principle | Meaning |
|---|---|
| **Simplicity First** | Minimal agent handoffs, minimal code touched, minimal new dependencies |
| **Root Cause Laziness** | No band-aid fixes — hunt the real cause |
| **Senior Developer Bar** | Every artifact should pass the "Would I merge this at Google?" test |
| **Trust but Verify** | Agents are fast but fallible — always verify diffs |

---

## Learned Patterns (append here)
<!-- Add specific failure patterns and lessons below -->

