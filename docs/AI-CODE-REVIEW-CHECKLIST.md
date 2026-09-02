# AI Code Review Checklist

Use this checklist before an AI-generated change is considered complete.

## Requirement

- [ ] Requirement is understood.
- [ ] Existing behavior is preserved unless intentionally changed.
- [ ] Acceptance criteria are satisfied.

## Architecture

- [ ] Existing architecture was inspected.
- [ ] Existing patterns are followed.
- [ ] No unnecessary architectural change was introduced.

## Reuse

- [ ] Existing components were searched.
- [ ] Existing hooks were searched.
- [ ] Existing utilities were searched.
- [ ] Existing services/API methods were searched.
- [ ] Existing types/constants were searched.
- [ ] Duplicate code was not introduced.

## Dead Code

- [ ] Unused imports removed.
- [ ] Unused variables removed.
- [ ] Unused functions removed.
- [ ] Unused components/hooks removed.
- [ ] Obsolete files removed where confirmed safe.
- [ ] Commented-out implementation removed.

## React

- [ ] Functional components used for new code.
- [ ] Hooks are used correctly.
- [ ] No unnecessary useEffect.
- [ ] No unnecessary state.
- [ ] No unnecessary memoization.
- [ ] No duplicate API calls.
- [ ] Stable list keys used.
- [ ] State is not mutated directly.
- [ ] Accessibility is preserved.

## Performance

- [ ] No avoidable request waterfall.
- [ ] Independent requests can run in parallel.
- [ ] No unnecessary large dependency added.
- [ ] Bundle impact considered.
- [ ] Expensive render work considered.
- [ ] Re-render behavior considered.

## Security

- [ ] Inputs are validated appropriately.
- [ ] Sensitive information is not logged or exposed.
- [ ] Existing authorization behavior is preserved.
- [ ] Unsafe DOM/API patterns were not introduced.

## Testing

- [ ] Relevant tests pass.
- [ ] New behavior is tested where appropriate.
- [ ] Regression coverage added for important bug fixes.
- [ ] Existing tests were not weakened unnecessarily.

## Quality

- [ ] ESLint passes.
- [ ] Build passes.
- [ ] SonarQube/SonarCloud checked when available.
- [ ] No new critical/blocker issues.
- [ ] No unnecessary dependency changes.
- [ ] No unrelated files changed.

## Final Diff

- [ ] Changed files are expected.
- [ ] No debug code remains.
- [ ] No console/debug statements remain unless project policy allows them.
- [ ] No temporary TODO implementation remains.
- [ ] Code is readable and maintainable.
