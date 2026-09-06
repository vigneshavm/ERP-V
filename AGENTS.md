# AGENTS.md — Repository-Wide Coding Agent Rules

> See also: `ARCHITECTURE.md` (full repo structure) and `CODING_PRINCIPLES.md` (mandatory coding
> standards) at the repo root — read both before creating or modifying code.

## Priority

These are repository-wide rules for AI coding agents.

Follow the existing codebase conventions first. Do not replace working project architecture with generic patterns without a requirement.

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
