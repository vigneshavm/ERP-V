
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env') });

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

async function testLogin() {
    console.log('Testing Login Flow...');

    // 1. Get a migrated user
    const { data: users, error: userError } = await supabase
        .from('tenant_users')
        .select('*')
        .eq('full_name', 'kamal') // Using the user we saw earlier
        .limit(1);

    if (userError || !users || users.length === 0) {
        console.error('❌ Could not find test user "kamal".');
        return;
    }

    const user = users[0];
    console.log(`Test User found: ${user.full_name}`);
    console.log(`- ID: ${user.id}`);
    console.log(`- Mobile: ${user.mobile}`);
    console.log(`- Password Hash: ${user.password_hash ? '[PRESENT]' : '[NULL]'}`);
    console.log(`- Pin Hash: ${user.pin_hash ? '[PRESENT]' : '[NULL]'} (Value: ${user.pin_hash})`);

    // 2. Attempt Login via RPC
    // We assume the legacy PIN "1111" might be the password if it was migrated?
    // Or we try to see if authentication works at all.

    const testPassword = '1111'; // Common test pin, or we can try others if known.
    console.log(`\nAttempting login with password: "${testPassword}"...`);

    const { data: loginResult, error: loginError } = await supabase.rpc('login_tenant_user', {
        p_tenant_id: user.tenant_id,
        p_identity: user.mobile,
        p_password: testPassword
    });

    if (loginError) {
        console.error('❌ RPC Error:', loginError);
    } else {
        console.log('Login Result:', JSON.stringify(loginResult, null, 2));

        if (loginResult && loginResult.success) {
            console.log('✅ Login SUCCESSFUL!');
        } else {
            console.log('❌ Login FAILED. (Expected if default password was not set during migration)');

            // 3. Diagnosis
            if (!user.password_hash) {
                console.warn('⚠️  Reason: User has NO password_hash. Migration did not populate it from PIN.');
            }
        }
    }
}

testLogin();
