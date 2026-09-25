import { test, expect } from './fixtures';
import { DEMO_USER } from './helpers/mocks';

/**
 * Covers frontend/src/features/auth/pages/Login.tsx end-to-end, and the logout path in
 * frontend/src/components/shared/Layout/Sidebar.tsx.
 *
 * With no session in localStorage, App.tsx's `viewMode` initializer falls back to 'LANDING'
 * (see App.tsx ~L193), so an unauthenticated visit to `/` shows the landing page, not the Login
 * form directly. These tests seed `erp_current_tenant` (but not `user`/`isAuthenticated`) so the
 * app resolves straight into TENANT view, where TenantView renders <Login /> because
 * `isLoggedIn` is false — this is the real navigation path a user hits after picking "Tenant
 * Interface" on the landing page or reloading a bookmarked tenant URL while logged out.
 */
test.describe('Authentication', () => {
    test.use({ authenticated: false });

    test.beforeEach(async ({ page }) => {
        await page.addInitScript(() => {
            window.localStorage.setItem('erp_current_tenant', 'demo-tenant');
        });
    });

    test('shows validation errors when submitting an empty login form', async ({ page }) => {
        await page.goto('/', { waitUntil: 'domcontentloaded' });

        const submit = page.getByRole('button', { name: /Authenticate Access/i });
        await expect(submit).toBeVisible({ timeout: 15000 });
        await submit.click();

        await expect(page.getByText('Email is required')).toBeVisible();
        await expect(page.getByText('Password is required')).toBeVisible();
    });

    test('shows an "Invalid email address" error for a malformed email', async ({ page }) => {
        await page.goto('/', { waitUntil: 'domcontentloaded' });

        await page.locator('#email').fill('not-an-email');
        await page.locator('#password').fill('irrelevant');
        await page.getByRole('button', { name: /Authenticate Access/i }).click();

        await expect(page.getByText('Invalid email address')).toBeVisible();
    });

    test('shows an authentication-failed alert on rejected credentials', async ({ page }) => {
        await page.route('**/api/auth/login', (route) =>
            route.fulfill({
                status: 401,
                contentType: 'application/json',
                body: JSON.stringify({ message: 'Invalid email or password.' }),
            })
        );

        await page.goto('/', { waitUntil: 'domcontentloaded' });
        await page.locator('#email').fill('wrong@vijayalaxmi.com');
        await page.locator('#password').fill('wrong-password');
        await page.getByRole('button', { name: /Authenticate Access/i }).click();

        await expect(page.getByText('Authentication Failed')).toBeVisible();
        await expect(page.getByText('Invalid email or password.')).toBeVisible();
        // A failed login must not leave a session lying around.
        expect(await page.evaluate(() => window.localStorage.getItem('isAuthenticated'))).toBeNull();
    });

    test('logs in successfully and lands on the dashboard', async ({ page }) => {
        await page.route('**/api/auth/login', (route) =>
            route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(DEMO_USER) })
        );

        await page.goto('/', { waitUntil: 'domcontentloaded' });
        await page.locator('#email').fill(DEMO_USER.email);
        await page.locator('#password').fill('CorrectHorseBatteryStaple1!');
        await page.getByRole('button', { name: /Authenticate Access/i }).click();

        // useAuthActions navigates to /dashboard once `user`/`isSuccess` land in Redux.
        await expect(page).toHaveURL(/\/dashboard/, { timeout: 15000 });
        // The persisted session should now match what the login response returned.
        const storedUser = await page.evaluate(() => window.localStorage.getItem('user'));
        expect(JSON.parse(storedUser ?? '{}')).toMatchObject({ email: DEMO_USER.email, role: DEMO_USER.role });
    });

    test('logs out and returns to the login screen', async ({ page }) => {
        // For this one test we DO want a pre-authenticated session (logout needs somewhere to
        // log out FROM), so seed it manually rather than via the `authenticated` fixture option.
        await page.addInitScript((u) => {
            window.localStorage.setItem('user', JSON.stringify(u));
            window.localStorage.setItem('token', u.token);
            window.localStorage.setItem('isAuthenticated', 'true');
            window.localStorage.setItem('erp_current_tenant', u.tenantId);
        }, DEMO_USER);

        await page.goto('/dashboard', { waitUntil: 'domcontentloaded' });
        await page.locator('aside, nav').first().waitFor({ state: 'visible', timeout: 15000 });

        await page.getByTitle('Logout').or(page.getByText('Terminate Protocol')).first().click();

        await expect(page.getByRole('button', { name: /Authenticate Access/i })).toBeVisible({ timeout: 15000 });
        expect(await page.evaluate(() => window.localStorage.getItem('isAuthenticated'))).toBeNull();
        expect(await page.evaluate(() => window.localStorage.getItem('user'))).toBeNull();
    });
});
