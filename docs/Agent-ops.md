# Agent-First Development Rules v1.0
> Using Google Antigravity · Updated: 2026-03-15

---

## Sticky Notes (Quick Reference)

- For **ANY non-trivial task** (≥3 logical steps or architectural choice): **ENTER PLAN MODE FIRST** — spawn Planner Agent immediately
- If agent goes sideways / hallucinates / loops: **PAUSE ALL**, comment on failing artifact → STOP → re-plan with fresh context window — **do NOT** let it keep pushing broken artifacts
- Use detailed specs + acceptance criteria in initial prompt to Planner Agent — reduce ambiguity before any code touches disk

---

## 1. Plan Node Default (Mission Control First)

- Enter full plan mode in Antigravity for anything non-trivial
- Spawn dedicated **Planner Agent** → output to artifact: `tasks/todo.md` with numbered, checkable items + verification conditions
- If anything deviates / fails verification: **halt agents**, review logs + artifact comments, re-plan — **do NOT** just approve & continue building

## 2. Subagent Strategy (leverage Antigravity's multi-agent nature)

- Spawn sub-agents liberally: Researcher, Code Writer, Test Runner, Browser Verifier, Terminal Executor, etc.
- Keep main Mission Control / your prompt clean — offload exploration, parallel analysis, documentation search to dedicated agents
- One focused responsibility per agent (**do NOT** give one agent 5 concerns — it degrades fast)
- For hard problems: spawn 2–3 parallel sub-agents with different angles → compare artifacts → pick/merge best path

## 3. Self-Improvement Loop (learn across sessions)

- After **ANY** correction / rejection / bad outcome from you:  
  → comment directly on the failing artifact  
  → spawn **Lessons Agent** or manually append pattern to `lessons.md`
- Write ruthless, specific rules for yourself / future agents  
  (e.g. "Never assume auth middleware exists — always verify via terminal agent first")
- Re-read `lessons.md` at start of every new session / new major task

## 4. Verification Before Done (Antigravity's strongest feature — use it!)

- **NEVER** mark task / mission complete without proving it works via agents
- Demand agents run: unit/integration tests + terminal verification + browser smoke test (spawn Browser Agent)
- Ask yourself (and comment in review):  
  "Would a staff/principal engineer at Google approve this artifact diff right now?"
- Use artifact commenting + diff review religiously — treat it like mandatory code review

## 5. Demand Elegance (Balanced – don't over-agent)

- For any fix / implementation that feels hacky / brittle: **pause agents**, comment  
  "feels hacky — re-plan more elegant path"
- Ask Planner Agent explicitly:  
  "Knowing everything we know now, is there a cleaner / more idiomatic / more maintainable way?"
- Skip deep elegance hunt only for dead-obvious trivial fixes — **do NOT** over-orchestrate 17 agents for +2 lines
- Challenge every multi-agent plan:  
  "Can this be done with 40% fewer agent handoffs?"

## 6. Autonomous Bug Fixing Mode

- Given bug / failing test / CI red: spawn **Debug Agent** → point it at logs + failing artifact + test output
- Let it iterate autonomously (plan → repro → fix → verify loop)
- Zero context switching from you unless agents are stuck after 2–3 self-corrections
- Fix failing E2E / integration tests without being spoon-fed reproduction steps

---

## Task Management in Antigravity

1. **Plan First** — always start with Planner Agent → write to `artifacts/tasks/todo.md`
2. **Verify Plan** — review + comment on plan artifact before approving execution
3. **Track Progress** — use Mission Control checkboxes + artifact status
4. **Explain Changes** — force agents to write review summary / why-section in every major artifact update
5. **Document Results** — final artifact includes proof (test logs, browser screenshots via Browser Agent, terminal output)
6. **Capture Lessons** — update `lessons.md` after every meaningful correction / failure pattern

---

## Core Principles (Antigravity-flavored)

- **Simplicity First** — minimal agent handoffs, minimal code touched, minimal new dependencies
- **Root Cause Laziness** — no band-aid agent fixes — hunt the real cause (spawn Analyzer Agent if needed)
- **Senior Developer bar** — every committed artifact should pass  
  "Would I merge this in a Google codebase?" test
- **Trust but Verify** — agents are fast but fallible — lean on artifact verification + your eyes on diffs

---

## Mandatory Workflow for This Project

**Rule 0 – No code before plan**

For **every** new feature, refactor, bugfix > trivial:

1. **Plan first** — always create `tasks/todo.md` artifact with:
   - Checkable steps
   - Verification / test conditions per step
   - "Done when..." definition

2. Human must review + approve plan → only then agents may edit files

3. After changes → auto-verify (tests, typecheck, browser if applicable)

4. On failure / correction → append root cause to `lessons.md`

Never bypass this. Break the rule = restart from plan.

---

## How to Use This File

- Pin it as a permanent artifact in Antigravity
- Set it as a custom prompt template / system instructions prefix
- Keep a copy in Obsidian / Notion / local notes
- Review it at the start of every serious coding session

Happy (agentic) building! 🚀