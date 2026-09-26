import type { Page, Route } from '@playwright/test';

/**
 * Shared fixtures + a small, extensible API-mocking layer for the ERP e2e suite.
 *
 * Why mock instead of hitting a real backend:
 *  - `frontend/e2e/inventory-search.spec.ts` (pre-existing) already established this pattern
 *    (route-intercept every `/api/**` call + seed an authenticated session into localStorage)
 *    and it works reliably against this codebase, so the new specs in this suite follow the
 *    same convention rather than inventing a second one.
 *  - The app is local-first (Dexie/IndexedDB + a bulk `useDBDataSync` hook — see
 *    frontend/src/hooks/useDBDataSync.ts) and most screens read from Redux state that's
 *    populated by that sync layer, not directly from a single page-load API call. Mocking
 *    `/api/**` wholesale (with a safe empty-array/object fallback for anything not explicitly
 *    handled) lets every screen render without requiring a live Mongo-backed backend, seeded
 *    tenant data, or network access — which is what makes this suite runnable with just
 *    `npm run dev -w frontend` and nothing else.
 *  - Tests that need to assert a specific write (creating a purchase, receiving a GRN, adding
 *    a product) still mock the real endpoint precisely and assert the outgoing request payload,
 *    so they're testing real app logic (form -> thunk -> HTTP call), not just UI state.
 *
 * To point this suite at a real backend instead, skip `installApiMocks`/`seedAuthSession` in a
 * given spec and use a real login (see the "real backend" example in auth.spec.ts) plus
 * Playwright's `storageState` to persist the session between tests.
 */

export const DEMO_TENANT_ID = 'demo-tenant';

export const DEMO_USER = {
    _id: '6990b7a1ae8ee1d38659a9e9',
    name: 'Vignesh Admin',
    email: 'vignesh@vijayalaxmi.com',
    role: 'SUPER_ADMIN',
    token: 'e2e-mock-jwt-token',
    tenantId: DEMO_TENANT_ID,
};

export const DEMO_TENANT = {
    _id: DEMO_TENANT_ID,
    id: DEMO_TENANT_ID,
    name: 'Vijaya Laxmi Retail',
    status: 'ACTIVE',
};

/**
 * Seeds an authenticated session into localStorage the same way `utils/session.ts`'s
 * `setSession()` does at runtime. Must be installed via `addInitScript` (not a post-navigation
 * `page.evaluate`) so it exists before App.tsx's lazy `useState` initializers
 * (`getSession()`, `localStorage.getItem('erp_current_tenant')`) run on first paint —
 * see frontend/src/App.tsx lines ~193-270.
 */
export async function seedAuthSession(page: Page, user: typeof DEMO_USER = DEMO_USER) {
    await page.addInitScript((u) => {
        window.localStorage.setItem('user', JSON.stringify(u));
        window.localStorage.setItem('token', u.token);
        window.localStorage.setItem('isAuthenticated', 'true');
        window.localStorage.setItem('erp_current_tenant', u.tenantId);
    }, user);
}

export interface ApiMock {
    /** Return true if this mock should handle the request. */
    match: (url: string, method: string) => boolean;
    respond: (route: Route) => Promise<void>;
}

const json = (route: Route, body: unknown, status = 200) =>
    route.fulfill({ status, contentType: 'application/json', body: JSON.stringify(body) });

/** Baseline mocks every screen in the app can rely on being present. */
function coreMocks(): ApiMock[] {
    return [
        {
            match: (url) => url.includes('/api/auth/profile'),
            respond: (route) => json(route, DEMO_USER),
        },
        {
            match: (url) => url.includes('/api/tenants'),
            respond: (route) => json(route, [DEMO_TENANT]),
        },
        {
            // The logged-in shop's tenant record is built from its business profile
            // (hooks/tenantQueries.ts fetchTenantsRaw), not from /api/tenants.
            match: (url) => url.includes('/api/business/profile'),
            respond: (route) => json(route, {
                success: true,
                data: { _id: DEMO_TENANT_ID, businessName: DEMO_TENANT.name, phone: '9000000000', email: 'shop@example.com', address: '1 Market Street' },
            }),
        },
        {
            match: (url) => url.includes('/api/settings'),
            respond: (route) => json(route, { data: { sector: 'Retail' } }),
        },
        {
            match: (url) => url.includes('/api/business-sectors'),
            respond: (route) => json(route, { data: [] }),
        },
        {
            match: (url) => /\/api\/masters\//.test(url),
            respond: (route) => json(route, []),
        },
        {
            match: (url) => url.includes('/api/inventory/categories'),
            respond: (route) => json(route, { data: [] }),
        },
        {
            match: (url) =>
                /\/api\/inventory\/(brands|sizes|colors|shelves)/.test(url),
            respond: (route) => json(route, []),
        },
        {
            match: (url, method) => method === 'GET' && /\/api\/inventory(\?|$)/.test(url),
            respond: (route) => json(route, { items: [], total: 0, page: 1, pages: 1 }),
        },
        {
            match: (url) => url.includes('/api/purchases/suppliers'),
            respond: (route) => json(route, []),
        },
        {
            match: (url, method) => method === 'GET' && /\/api\/purchases(\?|$)/.test(url),
            respond: (route) => json(route, []),
        },
        {
            match: (url) => url.includes('/api/grn') ,
            respond: (route) => json(route, []),
        },
    ];
}

/**
 * Installs the baseline mocks, then any `extraMocks` (checked first, so a spec's own mock for
 * a URL always wins over the generic fallback above). Anything left unmatched gets a safe empty
 * 200 response so the UI never hangs on a pending request — set `DEBUG_E2E_MOCKS=1` to log which
 * URLs fell through to that fallback, which is the fastest way to find what a new spec needs to
 * mock explicitly.
 */
export async function installApiMocks(page: Page, extraMocks: ApiMock[] = []) {
    const mocks = [...extraMocks, ...coreMocks()];
    await page.route('**/api/**', async (route) => {
        const req = route.request();
        const url = req.url();
        const method = req.method();

        for (const mock of mocks) {
            if (mock.match(url, method)) {
                return mock.respond(route);
            }
        }

        if (process.env.DEBUG_E2E_MOCKS) {
            // eslint-disable-next-line no-console
            console.log(`[e2e mock fallback] ${method} ${url}`);
        }
        return json(route, []);
    });
}

/** Attaches console/pageerror listeners that fail tests loudly instead of silently. Call once
 *  per test; Playwright auto-detaches listeners when the page closes. */
export function logBrowserDiagnostics(page: Page, testName: string) {
    page.on('console', (msg) => {
        if (msg.type() === 'error') {
            console.log(`[browser console error] (${testName}) ${msg.text()}`);
        }
    });
    page.on('pageerror', (err) => {
        console.log(`[browser page error] (${testName}) ${err.message}`);
    });
}
