# B2B Network Layer (`@repo/b2b-services`)

Centralized shared library that standardizes B2B data access, domain types, and React hooks across MFEs and shell applications.

## High-Level Architecture
- **Transport & Client**: Axios-based HTTP client with cross-cutting concerns (auth headers, timeouts, retries, error normalization).
- **Domain Services**: Plain functions per domain (partners, orders, catalog) that orchestrate endpoints and return validated data.
- **Schemas & Types**: Zod schemas generate runtime validation and TypeScript types to keep hooks type-safe.
- **React Hooks**: Thin wrappers over `@tanstack/react-query` that expose data fetching and mutations with cache keys and sensible defaults.
- **Configuration**: Single source for base URLs and feature toggles, overrideable by environment variables per host app.

### Data Flow
`React Component → Hook (usePartners) → Service (fetchPartners) → HTTP Client → B2B API → Zod Validation → React Query cache`

## Usage
1. Install/workspace sync: `npm install` at repo root to link workspace.
2. Provide base URL (optional): set `VITE_B2B_API_BASE_URL` or `B2B_API_BASE_URL`.
3. Wrap the host app with a `QueryClientProvider` (exported helper available) and import hooks:

```tsx
import { QueryClientProvider } from '@tanstack/react-query';
import { createB2BQueryClient, usePartners } from '@repo/b2b-services';

const queryClient = createB2BQueryClient();

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <PartnersWidget />
    </QueryClientProvider>
  );
}

function PartnersWidget() {
  const { data, isLoading } = usePartners();
  // render partners list...
}
```

## Contract: All API calls go through this layer
- ESLint blocks direct `fetch`/`axios` imports in MFEs and apps; use `@repo/b2b-services` hooks or `httpClient`.
- Avoid ad-hoc clients; add new endpoints via `src/services`, schemas in `src/types`, and expose through hooks in `src/hooks`.
- If a use case needs custom behaviour (e.g., polling), compose with `httpClient` + React Query inside this package, not in consumers.

## Extending
- Add new domain service in `src/services/<domain>.ts`.
- Define schema in `src/types/<domain>.ts` and export through `src/types/index.ts`.
- Create hook in `src/hooks` that wires `queryKey`, `queryFn`, and mutation side-effects.
- Re-export via `src/index.ts` to expose to consumers.
