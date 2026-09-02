# React Performance Standards

These rules are adapted for project-level AI coding guidance from Vercel's React Best Practices, which organizes optimization around async waterfalls, bundle size, server/client data fetching, re-renders, rendering, JavaScript performance, and advanced patterns.

## Priority

Apply performance guidance in this order:

1. Eliminate async/request waterfalls.
2. Reduce unnecessary bundle cost.
3. Avoid duplicate or unnecessary data fetching.
4. Reduce unnecessary re-renders.
5. Optimize rendering and expensive JavaScript work.
6. Apply advanced patterns only when justified.

## Async and Data Fetching

### Avoid Unnecessary Sequential Requests

If independent operations can run in parallel, prefer:

```ts
const [users, products] = await Promise.all([
  fetchUsers(),
  fetchProducts(),
]);
```

Do not serialize independent requests without a dependency reason.

### Defer Await

Do not perform expensive async work before a cheap condition that may make the work unnecessary.

### Avoid Duplicate API Calls

Before adding a request:

- Search for an existing hook/service.
- Check caching behavior.
- Check whether the same data is already available in state.
- Avoid duplicate effects that request the same resource.

## Bundle Size

- Avoid importing large libraries when a smaller/native solution is sufficient.
- Prefer direct imports when the project's module system and tooling benefit from them.
- Lazy-load genuinely heavy, non-critical components when appropriate.
- Do not add dependencies for trivial functionality.
- Defer non-critical third-party work when practical.

## Re-renders

Avoid unnecessary state updates.

Do not use `useMemo` or `useCallback` automatically. Use them when there is a measurable or clear rendering/stability benefit.

Avoid creating derived state that can be calculated from existing props/state.

Use stable list keys based on stable identity, not array indexes when item identity can change.

## useEffect

Do not use `useEffect` for ordinary calculations that can happen during render.

Before adding an effect, ask:

- Is this synchronization with an external system?
- Can this be derived during rendering?
- Can the event handler perform the work directly?
- Will this cause duplicate API calls or render loops?

## Component Architecture

Prefer composition over a component with many boolean flags.

Avoid growing APIs such as:

```tsx
<Component
  isEdit
  isAdmin
  isCompact
  isModal
  isSpecialMode
/>
```

when explicit composition or variants provide a clearer design.

## Expensive Work

Move expensive calculations out of frequently executed render paths when appropriate.

Use efficient data structures for repeated lookups:

- `Set`
- `Map`

Avoid repeated linear searches when a lookup structure is clearly more appropriate.

## Performance Safety

Do not apply performance patterns mechanically.

Every optimization must preserve:

- Correctness
- Accessibility
- Error handling
- Existing business behavior
- Maintainability

## Reference

Vercel Labs React Best Practices:
https://github.com/vercel-labs/agent-skills/tree/main/skills/react-best-practices
