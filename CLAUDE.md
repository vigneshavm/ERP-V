# CLAUDE.md — React Project AI Coding Guidelines

## Purpose

These rules apply to Claude Code and other AI coding agents working in this repository.

Primary goals:

- Keep the codebase clean, reusable, maintainable, and production-ready.
- Remove dead code and duplication.
- Reuse existing components, hooks, utilities, services, and types.
- Follow existing architecture instead of introducing unnecessary patterns.
- Apply React performance best practices.
- Maintain tests, linting, build quality, and SonarQube quality gates.

## Mandatory Workflow

Before changing code:

1. Understand the requirement and current behavior.
2. Inspect the relevant project structure.
3. Search for existing implementations that can be reused.
4. Identify affected dependencies, routes, APIs, state, and tests.
5. Make the smallest safe change that satisfies the requirement.
6. Remove obsolete/dead code created or exposed by the change.
7. Review for duplication, React performance, accessibility, and security.
8. Run relevant tests, lint, build, and SonarQube checks when available.
9. Review the final diff and ensure unrelated files were not changed.

## Search Before Creating

Before creating a new component, hook, utility, service, API method, type, constant, validator, or helper:

- Search the repository for an equivalent.
- Reuse or extend an existing implementation when appropriate.
- Do not create duplicate implementations.

## Dead Code Policy

Remove confirmed:

- Unused imports
- Unused variables
- Unused functions
- Unused components
- Unused hooks
- Unused services
- Unused constants
- Unused types
- Unreachable code
- Obsolete commented-out code
- Obsolete files
- Duplicate implementations

Before deleting code, check static imports, dynamic imports, routes, lazy loading, barrel exports, tests, configuration, and string-based references.

## React Standards

- Use functional components for new code.
- Keep components focused and reasonably small.
- Prefer composition over excessive conditional/boolean-prop complexity.
- Keep state as local as practical.
- Avoid unnecessary state and derived state.
- Avoid unnecessary useEffect/useMemo/useCallback.
- Follow the existing state-management and data-fetching architecture.
- Use stable keys for lists.
- Do not mutate React state directly.
- Keep business logic out of JSX when it can be cleanly separated.

## TypeScript

- Use TypeScript for new code when the project is TypeScript-based.
- Avoid `any`; use explicit types or `unknown` where appropriate.
- Reuse shared types.
- Do not create duplicate type definitions.
- Follow the project's existing type/interface conventions.

## API and Services

Prefer the existing architecture, normally:

Component → Hook → Service/API

Do not duplicate API wrappers or put complex service logic directly into UI components when an existing service layer exists.

## Dependencies

- Use the package manager already used by the repository.
- Do not switch package managers.
- Search existing dependencies before adding a package.
- Do not add a dependency when existing project functionality can solve the requirement.
- Do not upgrade dependencies unless required.

## Quality Gates

Before completing work, run applicable project commands from `package.json`, such as:

```bash
npm run lint
npm test
npm run build
```

Use the actual repository scripts rather than assuming these exact names exist.

Check SonarQube/SonarCloud when configured. Do not suppress issues merely to make the quality gate pass.

## Scope Control

Do not unnecessarily:

- Reformat unrelated files.
- Rename unrelated code.
- Rewrite working components.
- Change API contracts.
- Upgrade dependencies.
- Change architecture.
- Modify unrelated tests or configuration.

## Completion Report

When finished, report:

- Changes made.
- Reused code.
- Dead code removed.
- Tests/lint/build commands run.
- SonarQube result if available.
- Any remaining risks or checks that could not be run.
