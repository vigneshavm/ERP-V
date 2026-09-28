import type { Page } from '@playwright/test';
import { test, expect } from './fixtures';
import { DEMO_USER } from './helpers/mocks';

/**
 * Covers frontend/src/features/auth/pages/Login.tsx end-to-end, and the logout path in
 * frontend/src/components/shared/Layout/Sidebar.tsx.
 *
 * With no session in localStorage, App.tsx's `viewMode` initializer is 'LANDING' (it only
 * starts in TENANT view when a `user` session exists; a stored tenant alone isn't enough), so an
 * unauthenticated visit shows the landing page. openLogin() takes the real path from there:
 * "Tenant Interface" switches to TENANT view, where TenantView renders <Login /> because
 * `isLoggedIn` is false. Logging out from inside the tenant view returns to that Login form.
 */
const openLogin = async (page: Page) => {
    await page.goto('/', { waitUntil: 'domcontentloaded' });
    await page.getByRole('button', { name: /Tenant Interface/i }).click({ timeout: 15000 });
    await page.locator('#email').waitFor({ state: 'visible', timeout: 15000 });
};

test.describe('Authentication', () => {
    test.use({ authenticated: false });

    test('shows validation errors when submitting an empty login form', async ({ page }) => {
        await openLogin(page);

        const submit = page.getByRole('button', { name: /Authenticate Access/i });
        await expect(submit).toBeVisible({ timeout: 15000 });
        await submit.click();

        await expect(page.getByText('Email is required')).toBeVisible();
        await expect(page.getByText('Password is required')).toBeVisible();
    });

    test('shows an "Invalid email address" error for a malformed email', async ({ page }) => {
        await openLogin(page);

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

        await openLogin(page);
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

        await openLogin(page);
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
        // Wait for the logout control itself: the first `aside, nav` in the DOM can be a hidden one.
        const logout = page.getByTitle('Logout').or(page.getByText('Sign out')).first();
        await logout.waitFor({ state: 'visible', timeout: 15000 });
        await logout.click();

        await expect(page.getByRole('button', { name: /Authenticate Access/i })).toBeVisible({ timeout: 15000 });
        expect(await page.evaluate(() => window.localStorage.getItem('isAuthenticated'))).toBeNull();
        expect(await page.evaluate(() => window.localStorage.getItem('user'))).toBeNull();
    });
});
