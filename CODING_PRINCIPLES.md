# CODING_PRINCIPLES.md — Mandatory Coding Standards

These rules are mandatory for anyone — human or AI agent — writing or modifying code in this
repository. They apply on top of, and do not replace, the structure described in
`ARCHITECTURE.md` and the AI-agent workflow rules in `CLAUDE.md` / `AGENTS.md`. Where those files
give more specific, repo-tailored guidance (e.g. "check `ModuleRegistry.ts` after moving a page"),
follow the more specific rule — it exists because a generic rule wasn't enough here before.

## Before Creating New Code

Answer these, in order, before writing a new component, hook, service, API method, type,
constant, validator, or utility:

1. **Does an existing component solve this?** Search `frontend/src/components/shared/` and the
   relevant `features/<domain>/` first.
2. **Does an existing hook solve this?** Search `features/<domain>/hooks/` and the top-level
   `frontend/src/hooks/`.
3. **Does this belong to an existing feature (frontend) or module (backend)?** If the logic is
   about sales, it belongs under `features/sales/` or `backend/src/modules/sales/`, not a new
   top-level folder.
4. **Is this genuinely shared code?** "Used by two features" is not automatically "shared" — copy
   once, extract on the second real duplication, not preemptively. If it is shared, it belongs in
   a centralized folder (`components/shared/`, `redux/`, `services/`, `types/`, `utils/`, `hooks/`
   on the frontend; `repositories/`, `interfaces/`, `middlewares/` on the backend) — not duplicated
   per feature/module.
5. **Can framework-native composition solve it?** Prefer React composition, existing Redux
   patterns, existing Express middleware chaining, before introducing a new pattern.
6. **Will a new abstraction reduce duplication, or just add indirection?** An abstraction used
   once is not reducing anything. Do not create it until there is a second, real, concrete need
   for it.

Do not create a new abstraction, wrapper, or generic layer without a clear, demonstrated need
already present in the code you're touching.

## Mandatory Requirements

1. **Follow the existing project structure.** Frontend: feature-first under `features/<domain>/`.
   Backend: domain-module under `modules/<domain>/{controllers,services,models,routes}`. See
   `ARCHITECTURE.md`.
2. **Group business logic by feature/domain.** Sales logic goes in the sales feature/module, not
   scattered across shared utilities or a generic "helpers" file.
3. **Prefer simple, explicit implementations.** Write the direct version first. Add cleverness
   only when the direct version has a demonstrated problem (performance, duplication, correctness).
4. **Avoid unnecessary abstractions.** See "Before Creating New Code" above.
5. **Keep functions small and deterministic.** A function should do one thing and, given the same
   inputs, produce the same outputs — isolate side effects (API calls, `Date.now()`,
   `Math.random()`, `localStorage`) rather than burying them inside otherwise-pure logic. In React
   specifically: never call these directly in a render body — see `docs/REACT-PERFORMANCE.md` and
   the react-hooks lint rules already enforced in this repo (`set-state-in-effect`,
   `static-components`, `immutability`).
6. **Avoid global mutable state.** Use Redux (frontend) or explicit dependency passing (backend)
   instead of module-level mutable variables or singletons that hold request/session state.
7. **Use descriptive names.** No single-letter variables outside trivial loop indices, no
   abbreviations that aren't already established in this codebase (check `types/` and `interfaces/`
   for the domain's existing vocabulary before inventing new terms for the same concept).
8. **Add comments only for important assumptions/invariants.** Comment *why*, not *what* — the
   code already says what it does. Do not leave commented-out code; delete it (git history keeps
   it if it's ever needed).
9. **Handle errors explicitly.** No empty catch blocks, no swallowed promise rejections. Backend:
   surface errors through the existing middleware/error-handling pattern in `middlewares/`, not ad
   hoc per-controller try/catch that silently succeeds. Frontend: surface failures to the user or
   to the existing toast/error UI pattern, not `console.error` alone.
10. **Add structured logging at important system boundaries.** Backend: use the existing logger in
    `config/logger.ts`, not `console.log`, at request entry/exit, external service calls, and
    error paths. `console.log`/`console.error` left in committed code is dead-code-policy debt —
    remove it before finishing.
11. **Keep modules independently regenerable.** A feature/module should be understandable and
    re-implementable from its own folder plus the shared/centralized layers, without needing to
    read three other features to understand what it does. If understanding feature A requires
    reading feature B's internals, that's a dependency-direction violation — see
    `ARCHITECTURE.md` §2–3.
12. **Reuse framework-native patterns before introducing abstractions.** React: hooks and
    composition before a custom state-management layer. Express: middleware chaining before a
    custom pipeline abstraction. Redux Toolkit: slices and thunks as already used in
    `redux/slices/`, not a parallel state mechanism.
13. **Follow existing patterns when modifying code.** Match the file's own conventions (its import
    style — relative vs. `@/` alias, its component structure, its error handling) over your own
    preference, even if you'd write it differently from scratch. Consistency within a file beats a
    "better" pattern applied inconsistently.
14. **Prefer full-file rewrites for substantial refactoring.** When a change touches most of a
    file's logic (not a targeted fix), rewrite the file cleanly rather than layering patch on
    patch — but only after confirming, via diff review, that no unrelated behavior was dropped.
    For a small, targeted change, use a scoped edit instead — do not rewrite a whole file to
    change one line.
15. **Add focused tests for observable behavior.** Test what the function/component/endpoint does
    from the outside (inputs → outputs, or user-visible behavior), not its internal
    implementation details. Bug fixes get a regression test. See `docs/TESTING.md`.

## Verification Before Calling Work Done

- Run `tsc --noEmit` (or the subproject's `build` script) — 0 new errors.
- Run the subproject's `lint` script — 0 new errors/warnings beyond the existing baseline (both
  subprojects carry pre-existing findings; fixing them opportunistically is fine, introducing new
  ones is not).
- Run relevant tests (`npm test` in the affected subproject); add coverage for new/changed
  observable behavior per rule 15.
- Review the diff: confirm only the intended files changed, no dead code was left behind (rule 8,
  and the repo's broader dead-code policy in `docs/CODE-QUALITY.md`), and no debug logging (rule
  10) was left in.
- Check SonarQube/SonarCloud when configured — see `docs/SONARQUBE.md`.

## Relationship to Other Docs in This Repo

This repo already has topic-specific docs under `docs/` — don't duplicate them here, follow them:

- `docs/REACT-PERFORMANCE.md` — frontend performance rules (waterfalls, bundle size, re-renders).
- `docs/CODE-QUALITY.md` — dead code policy in detail.
- `docs/TESTING.md` — testing conventions and coverage expectations.
- `docs/SONARQUBE.md` — quality gate specifics.
- `docs/SECURITY.md` — security requirements.
- `docs/AI-CODE-REVIEW-CHECKLIST.md` — checklist to run before considering AI-authored code done.

If a rule in this file and a rule in one of those docs ever conflict, the more specific `docs/`
file wins for its topic — flag the conflict rather than silently picking one.
