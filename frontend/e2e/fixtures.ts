import { test as base, expect, type Page } from '@playwright/test';
import {
    ApiMock,
    DEMO_USER,
    installApiMocks,
    logBrowserDiagnostics,
    seedAuthSession,
} from './helpers/mocks';

type Fixtures = {
    /** Extra `ApiMock`s layered on top of the core set, checked before it. Override per-test
     *  or per-describe-block with `test.use({ apiMocks: [...] })`. */
    apiMocks: ApiMock[];
    /** Whether `page` should already have an authenticated session seeded before the first
     *  navigation. Defaults to true; set `test.use({ authenticated: false })` for specs that
     *  need to exercise the Login screen itself (see auth.spec.ts). */
    authenticated: boolean;
    /** A `page` with the API mocked (and, unless `authenticated: false`, a logged-in session
     *  seeded) so a spec can `await page.goto('/some/route')` straight away. */
    page: Page;
};

/**
 * Extends the base Playwright `test` with authenticated-session + API-mock setup, matching the
 * pattern already used by `e2e/inventory-search.spec.ts`. Keeping it in a fixture (rather than
 * copy-pasted `test.beforeEach` blocks per spec file) means every new spec sets up the same way
 * and a future change to how auth/mocking works only needs to happen in one place.
 */
export const test = base.extend<Fixtures>({
    apiMocks: [[], { option: true }],
    authenticated: [true, { option: true }],

    page: async ({ page, apiMocks, authenticated }, use, testInfo) => {
        await page.setViewportSize({ width: 1280, height: 800 });
        logBrowserDiagnostics(page, testInfo.title);
        await installApiMocks(page, apiMocks);
        if (authenticated) {
            await seedAuthSession(page);
        }
        await use(page);
    },
});

export { expect, DEMO_USER };

/**
 * Navigates to `path` as the already-authenticated demo user and waits for the app shell
 * (sidebar/nav/main) to mount, so tests don't each hand-roll the same wait.
 */
export async function gotoAsAuthenticatedUser(page: Page, path: string) {
    await page.goto(path, { waitUntil: 'domcontentloaded' });
    await page
        .locator('aside, nav, main, #root')
        .first()
        .waitFor({ state: 'attached', timeout: 15000 });
}
