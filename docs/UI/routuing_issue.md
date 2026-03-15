Let me dig deep into all the routing-related code across the monorepo.Now I have a complete picture of every routing layer. Let me produce the full analysis.---

## Routing Issues — Full Analysis

### Issue 1 🔴 — Enterprise runs two routers simultaneously inside a single page

`apps/enterprise/src/app/[[...slug]]/page.tsx` is a Next.js App Router catch-all that absorbs every URL under `/enterprise/**`. Inside it, it renders a `<BrowserRouter basename="/enterprise">`. This means every enterprise navigation event is evaluated by two routers in sequence:

1. Next.js App Router resolves the request → hits `[[...slug]]`
2. React Router `BrowserRouter` re-interprets `location.pathname` client-side

This creates a **double-routing problem**. On initial load with a deep URL like `/enterprise/purchase/bills`, Next.js serves the catch-all SSR'd shell, then React Router hydrates and re-renders. If there's any mismatch between what Next.js rendered and what React Router computes, you get a React hydration error. The `isClient` state + `useEffect` dance at the top of `CatchAllPage` is a workaround for exactly this — it delays rendering until after hydration to avoid the mismatch, but at the cost of a full blank flash on every page load.

**The right model for an enterprise MFE hosted under a basePath is either the Next.js App Router *or* React Router — never both.** Since the app already has a rich 100+ entry path map in `NavigationContext`, the App Router file-based routing is entirely bypassed and the `[[...slug]]` catch-all is just a shell holder. The fix is to commit to one router.

---

### Issue 2 🔴 — Auth shell's `window.location.href` navigation hard-codes `localhost:3000`

In `mfe/common/auth/src/App.tsx`:

```ts
// This breaks in every non-local environment
window.location.href = 'http://localhost:3000/personal/home';
window.location.href = '/business';
window.location.href = '/enterprise';
```

The `personal` redirect hardcodes `localhost:3000` — this is a production URL bug. On staging or production, this would navigate to `localhost` instead of the deployed domain. The `business` and `enterprise` redirects use relative paths (correct pattern), but the `personal` one does not, which means any deployment that isn't `localhost` would fail silently by sending the user nowhere useful.

Additionally, `window.location.href` assignment is a **full page reload**. It destroys all in-memory React state, forces a fresh document load, and defeats every optimisation Next.js provides (prefetching, client-side transitions, shared layouts). Given that `auth` *is* the shell responsible for routing between apps, this is the highest-traffic navigation path in the entire system.

---

### Issue 3 🔴 — `personal` app: duplicate routes for the same view

```
apps/personal/app/budget/page.tsx   → renders <BudgetView />
apps/personal/app/budgets/page.tsx  → renders <BudgetView />  ← identical
```

Two live routes, one component. More importantly, the two `NavigationContext` implementations use *different* canonical paths for `'Budget'`:

- `apps/personal/contexts/NavigationContext.tsx` maps `'Budget' → '/budget'`
- `mfe/personal/budget-planner/src/contexts/NavigationContext.tsx` maps `'Budget' → '/budgets'`

This means if a user navigates to `/budget` via the `personal` app, the `NavigationContext` reports `currentView === 'Budget'` and highlights the correct nav item. But if the same user arrives at `/budgets` (which also renders `BudgetView`), the context maps it to `'Budget'` too — but only in the MFE version, not in the app version. Depending on which `NavigationProvider` is mounted, the nav highlight is wrong 50% of the time. This is a direct consequence of the app/MFE duplication described below.

---

### Issue 4 🔴 — `apps/personal` is a complete duplicate of `mfe/personal/budget-planner`

Every feature, context, component, and route in `apps/personal` is a copy of `mfe/personal/budget-planner`. Both have:

- `features/expenses/`, `features/dashboard/`, `features/goals/`, `features/reports/`, `features/settings/`
- Identical `NavigationContext.tsx`, `AuthContext.tsx`, `SettingsContext.tsx`
- Identical `app/layout.tsx` (both wrap in `AuthGuard → LanguageProvider → AuthProvider → SettingsProvider → ExpenseProvider → NavigationProvider → ClientLayout`)

The `apps/personal/next.config.ts` even lists `@repo/mfe-budget-planner` as a `transpilePackage`, suggesting the intent was for `apps/personal` to be a thin shell that *imports* from the MFE — but instead it grew into a full parallel implementation. The result is that bug fixes and feature changes must be applied in two places, and the two codebases are already diverging (e.g., the `NavigationContext` in the MFE has `appPin` and `setPinMode` state; the one in `apps/personal` does not).

---

### Issue 5 🟠 — `enterprise` `NavigationContext` has 100+ view→path entries that must stay in sync with `menu.config.ts`

`NavigationContext.tsx` in enterprise contains two 100+ entry manually maintained hashmaps:

1. `pathMap` — path string → `AppView` enum
2. `viewToPath` — `AppView` enum → path string

These must perfectly mirror `menu.config.ts` which also maps `AppView` → path. **Three separate files define the same routing truth.** When a new menu item is added in `menu.config.ts`, it must also be added in *both* directions in `NavigationContext`. If any entry is missing or mismatched, navigation silently falls back to `'LANDING'` (the `|| 'LANDING'` default) with no error.

Concretely: `BANK_ACCOUNTS` in `menu.config.ts` has `path: '/cashbank/accounts'`, and `NavigationContext` maps `'BANK_ACCOUNTS' → '/cashbank/accounts'`. But `SUPPLIER_LIST` in `menu.config.ts` uses `path: '/suppliers'`, while the NavigationContext maps `'SUPPLIERS'` (not `'SUPPLIER_LIST'`) → `/suppliers`. That enum mismatch means clicking the Supplier menu item in some code paths silently falls back to landing rather than navigating.

---

### Issue 6 🟠 — `?view=CategoryDetails` is a UI state disguised as a URL

In `apps/personal/app/expenses/page.tsx`:

```tsx
function ExpensesContent() {
  const searchParams = useSearchParams();
  const view = searchParams.get('view');  // 'CategoryDetails' or null
  if (view === 'CategoryDetails') return <CategoryDetailsView />;
  return <ExpensesView />;
}
```

And in `NavigationContext.navigateToCategoryDetails`:

```ts
router.push('/expenses?view=CategoryDetails');
// category state lives in Context, NOT in the URL
```

The category ID, name, value, and color are stored in React context state — they are not in the URL. This means:

- **Refresh on `/expenses?view=CategoryDetails`** renders `<CategoryDetailsView />` with `null` category state → blank/broken UI
- **Back button** goes to `/expenses` (no query), correct view restores
- **Direct link to a category is impossible** — the URL carries no identity, only a view mode switch
- **SSR/prefetch** of this URL is impossible since the data lives only in transient context

The fix is a proper dynamic route: `/expenses/[categoryId]`.

---

### Issue 7 🟠 — `signup/page.tsx` has `"use client"` in the wrong position

```ts
import { logger } from '@/shared/lib/logger';
// eslint-disable-next-line @typescript-eslint/no-unused-expressions -- TODO(TS-FIX): Phase 2/3 fix
"use client";
```

The `"use client"` directive is on line 3, after an import. The Next.js App Router requires `"use client"` to be the **very first line** of the file (before any imports). When it appears after an import, Next.js either ignores it (treating the module as a Server Component) or throws a build-time error depending on version. The ESLint suppression comment above it is suppressing the error that would have flagged this placement — compounding the bug.

---

### Issue 8 🟡 — `reset-password/page.tsx` navigates to `/login` which doesn't exist in the App Router

```ts
useEffect(() => {
  if (isSuccess) {
    const t = setTimeout(() => router.push('/login'), 2500);
    return () => clearTimeout(t);
  }
}, [isSuccess, router]);
```

There is no `app/login/page.tsx` in the enterprise app. The enterprise app's login flow lives inside `TenantView` / `App.tsx` React Router, not in Next.js file-based routes. `router.push('/login')` from `next/navigation` will hit the `[[...slug]]` catch-all, which will then render the enterprise shell, which will try to resolve `/login` in the React Router pathMap — and there is no `/login` entry in `NavigationContext.pathMap`, so it falls back to `'LANDING'`. The user ends up at the landing page instead of the login form.

---

### Issue 9 🟡 — `forgot-password` and `reset-password` use Next.js `<Link href="/login">` while enterprise routes are React Router

Both auth pages use `next/link`:
```tsx
<Link href="/login">Return to Sign In</Link>
```

But `/login` is not a Next.js App Router route — it's handled by the React Router inside `[[...slug]]`. Clicking this link triggers a Next.js client-side navigation to `/login`, which re-hits the catch-all, which boots the enterprise React Router at `/login`, which finds no match and falls to `'LANDING'`. The "Return to Sign In" button on the forgot-password page silently lands on the ERP landing page rather than the login screen.

---

### Issue 10 🟡 — Nginx only routes `/api` — no MFE path routing at the infrastructure level

`nginx.conf` has a single location block: `location /api/ → proxy backend`. There is no routing for `/personal`, `/business`, or `/enterprise` paths. The MFE routing entirely depends on Next.js rewrites defined in the auth shell's `next.config.ts` — which only works while the auth shell is running. In any deployment that takes the auth shell offline, or any environment that fronts these apps directly (CDN, Docker without the auth shell, CI preview deployments), the cross-app routing collapses entirely.

---

## Refactored Routing Architecture

The fix is a single routing authority at the shell level, with each MFE owning its own internal routes cleanly:

```
                    Nginx / Reverse Proxy
                  /personal  →  :3001
                  /business  →  :3003
                  /enterprise → :3004
                  /          →  :3000 (auth shell)
                  /api       →  :5000

          ┌────────────────────────────────┐
          │    Auth Shell (:3000)          │
          │    Next.js App Router only     │
          │    /  → LoginPage or           │
          │        SelectionPage           │
          │    handleSelection uses        │
          │    Next.js <Link> or           │
          │    router.push (relative)      │
          └────────────────────────────────┘

  ┌──────────────┐  ┌──────────────┐  ┌──────────────────────────────┐
  │  personal    │  │  business    │  │  enterprise                  │
  │  App Router  │  │  App Router  │  │  App Router ONLY             │
  │  /personal/* │  │  /business/* │  │  /enterprise/[...slug]       │
  │  No RR       │  │  No RR       │  │  No BrowserRouter inside     │
  │  CategoryId  │  │              │  │  NavigationContext drives     │
  │  → dynamic   │  │              │  │  next/navigation router.push  │
  │  route       │  │              │  │  Single source of truth      │
  └──────────────┘  └──────────────┘  └──────────────────────────────┘
```

**Key fixes in code:**

```ts
// mfe/common/auth/src/App.tsx — FIXED
// No window.location.href, no hardcoded localhost
import { useRouter } from 'next/navigation';

const router = useRouter();

const handleSelection = (type: 'personal' | 'business' | 'enterprise') => {
  // All relative — works on any hostname, no full reload
  const destinations = {
    personal: '/personal/home',
    business: '/business',
    enterprise: '/enterprise',
  } as const;
  router.push(destinations[type]);
};
```

```ts
// apps/enterprise: eliminate BrowserRouter, use next/navigation throughout
// apps/enterprise/src/app/[[...slug]]/page.tsx — FIXED
'use client'; // must be first line, no imports before it

import { useRouter, usePathname } from 'next/navigation';
// Remove: import { BrowserRouter } from 'react-router-dom';
// Remove: isClient / useEffect hydration workaround

export default function CatchAllPage() {
  // NavigationContext now uses next/navigation internally
  return (
    <Suspense fallback={<LoadingSpinner />}>
      <NavigationProvider>
        <EnterpriseMainView />
      </NavigationProvider>
    </Suspense>
  );
}
```

```ts
// NavigationContext enterprise — FIXED
// Single source of truth, eliminates dual hashmap maintenance
import { useRouter, usePathname } from 'next/navigation';

// Replace 200-line dual-map with a single typed config consumed by both
// menu.config.ts AND NavigationContext:
export const ROUTE_MAP: Record<AppView, string> = {
  DASHBOARD: '/enterprise/dashboard',
  POS: '/enterprise/pos',
  PURCHASE_BILLS: '/enterprise/purchase/bills',
  BANK_ACCOUNTS: '/enterprise/cashbank/accounts',
  SUPPLIER_LIST: '/enterprise/suppliers',
  // ... single definition, imported by both menu.config.ts and NavigationContext
} as const;

// NavigationContext then becomes trivial:
const setCurrentView = (view: AppView) => {
  const path = ROUTE_MAP[view];
  if (path) router.push(path);
};

const currentView = (Object.entries(ROUTE_MAP) as [AppView, string][])
  .find(([, path]) => pathname.startsWith(path))?.[0] ?? 'LANDING';
```

```tsx
// Fix CategoryDetails: proper dynamic route instead of ?view= query hack
// apps/personal/app/expenses/[categoryId]/page.tsx
'use client';
import { use } from 'react';
import CategoryDetailsView from '../../../features/expenses/views/CategoryDetailsView';

export default function CategoryDetailPage({
  params
}: { params: Promise<{ categoryId: string }> }) {
  const { categoryId } = use(params);
  return <CategoryDetailsView categoryId={categoryId} />;
}

// Navigation call becomes:
router.push(`/expenses/${categoryId}`);
// Now shareable, bookmarkable, refresh-safe, SSR-compatible
```

```nginx
# nginx.conf — FIXED: route all MFE paths at infrastructure level
server {
  listen 80;

  location /api/ {
    proxy_pass http://backend:5000;
    proxy_http_version 1.1;
    proxy_set_header Host $host;
  }

  location /personal/ {
    proxy_pass http://personal:3001;
    proxy_http_version 1.1;
    proxy_set_header Host $host;
  }

  location /business/ {
    proxy_pass http://business:3003;
    proxy_http_version 1.1;
    proxy_set_header Host $host;
  }

  location /enterprise/ {
    proxy_pass http://enterprise:3004;
    proxy_http_version 1.1;
    proxy_set_header Host $host;
  }

  # Auth shell handles root and unknown paths
  location / {
    proxy_pass http://auth:3000;
    proxy_http_version 1.1;
    proxy_set_header Host $host;
  }
}
```