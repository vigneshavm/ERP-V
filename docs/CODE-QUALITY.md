# Code Quality and Dead Code Standards

## Objective

Maintain a codebase with:

- No dead code
- Minimal duplication
- Reusable implementations
- Clear responsibilities
- Meaningful naming
- Low complexity
- Strong testability
- SonarQube compliance

## Dead Code

Remove confirmed:

- Unused imports
- Unused variables
- Unused functions
- Unused components
- Unused hooks
- Unused services
- Unused constants
- Unused types
- Unreachable branches
- Obsolete files
- Commented-out implementations

Use Git history instead of preserving obsolete code in comments.

## Safe Deletion

Before deleting a function/component/file, search for:

- Static imports
- Dynamic imports
- Routes
- Lazy-loaded routes
- Barrel exports
- Tests
- Configuration
- Build scripts
- String references
- Runtime registration

## Reusability

Before adding code, search for an existing implementation.

Prefer:

Existing code → Extend → Extract shared logic → Create new code only if necessary.

Do not create generic abstractions for one-off behavior without a real reuse case.

## Duplication

Do not copy/paste business logic.

If multiple implementations perform the same responsibility:

1. Confirm that the behavior is genuinely shared.
2. Extract a focused reusable function/component/hook.
3. Replace duplicate usages.
4. Remove obsolete implementations.
5. Add/update tests.

## Functions

Functions should:

- Have one clear responsibility.
- Have meaningful names.
- Avoid excessive parameters.
- Avoid deep nesting.
- Avoid hidden side effects.
- Be easy to test.

## Naming

Avoid vague names such as:

```text
data
temp
value
obj
x
y
result
```

when a domain-specific name is possible.

Prefer:

```text
employeeData
orderTotal
customerResponse
approvedOrders
```

## Magic Values

Use existing project constants/enums for repeated business values.

Do not introduce a second representation for an existing status or domain value.

## Comments

Comments should explain why, not restate obvious code.

Do not keep commented-out production implementations.

## Refactoring

Refactor when it clearly improves:

- Readability
- Reuse
- Maintainability
- Testability
- Performance
- Reliability

Avoid unrelated refactoring during a focused bug fix.

## Quality Checklist

- [ ] No unused imports
- [ ] No unused variables
- [ ] No unused functions
- [ ] No unused components/hooks/services
- [ ] No obsolete commented code
- [ ] No unnecessary duplication
- [ ] Existing reusable code was considered
- [ ] Naming is meaningful
- [ ] Complexity is reasonable
- [ ] No unnecessary abstraction
