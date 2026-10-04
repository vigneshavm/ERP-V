# AGENTS.md — Repository-Wide Coding Agent Rules

> See also: `docs/ARCHITECTURE.md` (full repo structure), `docs/CODING_PRINCIPLES.md` (mandatory coding
> standards), and `docs/BACKEND_STANDARDS.md` (backend consistency & architecture standard) — read before creating or modifying code.

## Priority

These are repository-wide rules for AI coding agents.

Follow the existing codebase conventions first. Do not replace working project architecture with generic patterns without a requirement.

## Rules for every task (SQL data work)

These apply to every task that touches ERP data, pages or APIs, in addition to the rules below.

- [ ] Use only tables and columns that already exist in the configured SQL databases and have been verified by read-only metadata inspection.
- [ ] Do not create, alter, migrate, seed, repair, or add indexes/constraints/triggers to any SQL database. Do not run `backend/sql/erp/*.sql`.
- [ ] Do not store missing data in unrelated tables, JSON/config blobs, notes, or free-text fields. Do not create a hidden ID crosswalk.
- [ ] Do not drop a UI page before its page/API/database behavior has been reviewed. A screen with no compatible existing SQL storage must clearly show a reduced scope or an unavailable operation.
- [ ] No Mongo fallback, mirror, shadow write, or false-success response in a SQL path.
- [ ] Record the affected UI route, API method/path, backend handler, SQL tables/columns, business behavior lost or retained, and verification evidence for each completed task.

## Core Principles

**Understand → Search → Reuse → Implement → Clean → Test → Validate**

### 1. Understand

Read the relevant files before making changes. Understand data flow, component ownership, API contracts, state management, routing, and tests.

### 2. Search

Search for existing:

- Components
- Hooks
- Services
- API methods
- Utilities
- Types
- Constants
- Validation
- Error handling
- Tests

### 3. Reuse

Prefer extending/reusing existing code over creating duplicates.

### 4. Implement

Make the smallest safe change required by the task.

### 5. Clean

Remove obsolete code, unused imports/variables/functions, duplicate logic, and temporary code.

### 6. Test

Run relevant tests and add regression coverage for bug fixes.

### 7. Validate

Run lint, build, and SonarQube/SonarCloud checks when configured.

## React

- Functional components for new code.
- Focused, reusable components.
- Prefer composition over boolean-prop proliferation.
- Avoid unnecessary effects and state.
- Avoid unnecessary memoization.
- Avoid duplicate API calls.
- Keep state local unless shared state is genuinely required.
- Preserve accessibility.
- Follow the installed React version's APIs and project conventions.

## Performance

Apply the React performance guidance in `docs/REACT-PERFORMANCE.md`.

Prioritize:

1. Eliminating request waterfalls.
2. Reducing unnecessary bundle size.
3. Avoiding duplicate data fetching.
4. Preventing unnecessary re-renders.
5. Avoiding expensive work during rendering.
6. Using lazy/dynamic loading for genuinely heavy or non-critical code.

Do not optimize blindly. Verify that a proposed optimization fits the actual architecture and workload.

## Dead Code

No dead code should remain after a completed change. See `docs/CODE-QUALITY.md`.

## Testing

Follow `docs/TESTING.md`.

## SonarQube

Follow `docs/SONARQUBE.md`.

## Final Rule

Do not optimize for more code. Optimize for:

**less code + reuse + correctness + testability + maintainability + performance + security**
