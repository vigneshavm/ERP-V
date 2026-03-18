import { test, expect } from '@playwright/test';
import * as jose from 'jose';

test('Verify Estimates Page Rendering', async ({ page }) => {
    test.setTimeout(60000);
    
    const secret = new TextEncoder().encode(process.env.JWT_SECRET || 'your_super_secure_jwt_secret_key_change_me');
    const token = await new jose.SignJWT({ id: 'dev-123', email: 'avmvignesh0207@gmail.com', role: 'superadmin' })
        .setProtectedHeader({ alg: 'HS256' })
        .setIssuedAt()
        .setExpirationTime('2h')
        .sign(secret);

    // Initial load to set domain context
    await page.goto('http://localhost:3100/');
    
    await page.evaluate((jwt) => {
        const userObj = { 
            id: 'dev-123', 
            email: 'avmvignesh0207@gmail.com', 
            name: 'Developer Dev', 
            role: 'superadmin',
            token: jwt
        };
        
        localStorage.setItem('auth-storage', JSON.stringify({
            state: {
                user: userObj,
                isAuthenticated: true,
                token: jwt,
                role: 'superadmin'
            },
            version: 0
        }));

        localStorage.setItem('user', JSON.stringify(userObj));
        localStorage.setItem('erp_current_tenant', 'tenant-123'); // Target a generic tenant
        
        document.cookie = `auth_token=${jwt}; path=/`;
        document.cookie = `session=dev-bypass; path=/`;
    }, token);


    console.log('Navigating to Estimates...');
    await page.goto('http://localhost:3100/enterprise/sales/estimates');
    await page.waitForTimeout(5000);
    await page.screenshot({ path: 'estimates-ok.png' });
    expect(await page.content()).toContain('Estimates');

    console.log('Navigating to POS...');
    await page.goto('http://localhost:3100/enterprise/pos');
    await page.waitForTimeout(5000);
    await page.screenshot({ path: 'pos-ok.png' });
    expect(await page.content()).toContain('Basket');

    console.log('Navigating to Inventory Items...');
    await page.goto('http://localhost:3100/enterprise/inventory/items');
    await page.waitForTimeout(5000);
    await page.screenshot({ path: 'inventory-ok.png' });
    expect(await page.content()).toContain('Inventory');
});
