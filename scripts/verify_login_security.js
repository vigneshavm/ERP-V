
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env') });

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

async function verifyLoginSecurity() {
    console.log('Verifying Login Security Patch...');

    // 1. Check if backfill worked (Password hash should be populated)
    const { data: users, error: userError } = await supabase
        .from('tenant_users')
        .select('id, full_name, mobile, password_hash, pin_hash')
        .eq('full_name', 'kamal')
        .limit(1);

    if (userError || !users || users.length === 0) {
        console.error('❌ Could not find test user "kamal".');
        return;
    }

    const user = users[0];
    console.log(`Test User: ${user.full_name}`);

    if (user.password_hash && user.password_hash.startsWith('$2')) {
        console.log('✅ Backfill Verified: password_hash is populated with bcrypt hash.');
    } else {
        console.error('❌ Backfill FAILED: password_hash is NULL or invalid.');
        console.log('Current Value:', user.password_hash);
    }

    // 2. Test Success Case (Correct PIN as Password)
    // Pin is 1111. Backfill should have hashed "1111".
    console.log('\nTest 1: Valid Credentials (PIN: 1111)');
    const { data: successResult, error: successError } = await supabase.rpc('login_tenant_user', {
        p_tenant_id: (await supabase.from('tenants').select('id').eq('subdomain', 'vignesh').single()).data.id,
        p_identity: user.mobile,
        p_password: '1111'
    });

    if (successError) {
        console.error('❌ RPC Error (Success Test):', successError);
    } else if (successResult && successResult.success) {
        console.log('✅ Login Successful with correct PIN.');
    } else {
        console.error('❌ Login FAILED with correct PIN.');
        console.log('Result:', successResult);
    }

    // 3. Test Failure Case (Wrong Password)
    console.log('\nTest 2: Invalid Credentials (Password: "wrongpass")');
    const { data: failResult, error: failError } = await supabase.rpc('login_tenant_user', {
        p_tenant_id: (await supabase.from('tenants').select('id').eq('subdomain', 'vignesh').single()).data.id,
        p_identity: user.mobile,
        p_password: 'wrongpass'
    });

    if (failError) {
        console.error('❌ RPC Error (Fail Test):', failError);
    } else if (failResult && !failResult.success && failResult.message === 'Invalid credentials') {
        console.log('✅ Security Verified: Rejected invalid password.');
    } else {
        console.error('❌ Security FAILED: Did not reject invalid password correctly.');
        console.log('Result:', failResult);
    }
}

verifyLoginSecurity();
