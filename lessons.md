# Agent-Ops Playbook: core principles

## 1. Plan Node Default (Mission Control First)
- Enter full plan mode in Antigravity for anything non-trivial.
- Spawn dedicated **Planner Agent** → output to artifact: `tasks/todo.md` with numbered, checkable items + verification conditions.
- If anything deviates / fails verification: **halt agents**, review logs + artifact comments, re-plan — do NOT just approve & continue building.

## 2. Subagent Strategy
- Spawn sub-agents liberally: Researcher, Code Writer, Test Runner, Browser Verifier, Terminal Executor, etc.
- Keep main Mission Control clean — offload exploration, parallel analysis, and documentation search.
- One focused responsibility per agent (do NOT give one agent 5 concerns).
- For hard problems: spawn 2–3 parallel sub-agents with different angles → compare artifacts → pick/merge best path.

## 3. Self-Improvement Loop
- After ANY correction / rejection / bad outcome: 
  → comment directly on the failing artifact.
  → spawn **Lessons Agent** or manually append pattern to `lessons.md`.
- Write ruthless, specific rules for future agents.
- Re-read `lessons.md` at start of every new session / new major task.

## 4. Verification Before Done
- **NEVER** mark task / mission complete without proving it works via agents.
- Demand agents run: unit/integration tests + terminal verification + browser smoke test.
- Ask: "Would a staff/senior-level engineer at Google approve this artifact diff right now?"
- Use artifact commenting + diff review religiously.

## 5. Demand Elegance
- For any fix / implementation that feels hacky: **pause agents**, comment "feels hacky — re-plan more elegant path".
- Challenge every multi-agent plan: "Can this be done with 40% fewer agent handoffs?"

## 6. Autonomous Bug Fixing Mode
- Given bug / failing test / CI red: spawn **Debug Agent** → point it at logs + failing artifact + test output.
- Let it iterate autonomously (plan → repro → fix → verify loop).
- Zero context switching from user unless agents are stuck after 2–3 self-corrections.

---
*Generated: 2026-03-15*
