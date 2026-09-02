# Testing Standards

## Objective

Every behavior change should be validated with appropriate automated tests.

## New Features

For new functionality:

- Add unit tests for important logic.
- Add component tests for user-visible behavior.
- Add integration tests where multiple layers interact.
- Cover important error and edge cases.

## Bug Fixes

Every meaningful bug fix should include a regression test when practical.

The test should fail before the fix and pass after the fix whenever the testing architecture allows it.

## Test Cases

Consider:

- Happy path
- Empty data
- Loading state
- Error state
- Invalid input
- Boundary values
- Permission/authorization behavior
- API failure
- User interaction
- State transitions

## React Tests

Prefer testing observable behavior rather than implementation details.

Avoid tests that depend unnecessarily on:

- Internal component state
- Private implementation functions
- Exact internal hook calls

## Existing Tests

Do not delete or weaken tests merely to make a change pass.

If behavior intentionally changes:

1. Update the test.
2. Explain the changed expected behavior.
3. Add regression coverage where appropriate.

## Validation

Use the scripts defined in `package.json`.

Typical commands may include:

```bash
npm test
npm run test
npm run lint
npm run build
```

Do not assume these exact scripts exist.

## Completion

Before completing a task:

- [ ] Relevant tests pass.
- [ ] New behavior has coverage where appropriate.
- [ ] Regression tests exist for important bug fixes.
- [ ] No tests were removed without justification.
