# SonarQube / SonarCloud Standards

## Objective

Maintain a clean quality gate and prevent new reliability, security, and maintainability problems.

## Required Review Areas

### Bugs

Review and fix:

- Null/undefined risks
- Incorrect conditions
- Unreachable code
- Incorrect async behavior
- Resource-handling problems

### Vulnerabilities

Review:

- Unsafe input handling
- Injection risks
- Sensitive data exposure
- Unsafe DOM operations
- Insecure API handling
- Authentication/authorization mistakes

### Code Smells

Pay particular attention to:

- Dead code
- Duplicate code
- Large functions
- Excessive complexity
- Poor naming
- Unnecessary nesting
- Repeated logic
- Unused variables/imports
- Unnecessary abstractions

### Coverage

Changed business logic should have appropriate automated test coverage.

### Duplication

Do not introduce repeated blocks or duplicate business logic.

## Quality Gate

Before merge, the project should satisfy its configured SonarQube/SonarCloud quality gate.

Do not:

- Disable Sonar rules globally to hide problems.
- Add suppressions solely to make the quality gate pass.
- Reduce test coverage merely to avoid a coverage issue.

If a suppression is genuinely necessary, keep it narrow and document why.

## New Code Priority

When working on existing code:

1. Fix issues introduced by the current change.
2. Avoid expanding scope into unrelated legacy cleanup.
3. If severe pre-existing issues block the task, report them clearly.

## Final Validation

Where configured, run the repository's Sonar analysis command or CI pipeline and report:

- Quality Gate
- New Bugs
- New Vulnerabilities
- New Code Smells
- Coverage
- Duplication

If Sonar cannot be executed locally, state that clearly rather than claiming it passed.
