
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env') });

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

async function diagnoseUser() {
    const targetMobile = '8148256362';
    const targetTenant = '7ea0aa94-a0e7-448e-ab47-39838da6c466';

    console.log(`Diagnosing User: ${targetMobile} in Tenant: ${targetTenant}`);

    // 1. Fetch User by Mobile only (ignoring tenant for a moment to see if they exist at all)
    const { data: userByMobile, error: error1 } = await supabase
        .from('tenant_users')
        .select('*')
        .eq('mobile', targetMobile);

    if (error1) {
        console.error('Error fetching by mobile:', error1);
        return;
    }

    if (userByMobile.length === 0) {
        console.error('❌ User not found with this mobile number in ANY tenant.');
        return;
    }

    console.log(`Found ${userByMobile.length} user(s) with this mobile.`);

    const user = userByMobile[0];
    console.log('User Details:');
    console.log(`- ID: ${user.id}`);
    console.log(`- Name: ${user.full_name}`);
    console.log(`- Tenant ID: ${user.tenant_id}`);
    console.log(`- Is Active: ${user.is_active}`);
    console.log(`- Pin Hash: ${user.pin_hash}`);
    console.log(`- Password Hash: ${user.password_hash ? user.password_hash.substring(0, 10) + '...' : 'NULL'}`);

    // 2. Check Validations
    if (user.tenant_id !== targetTenant) {
        console.error(`❌ Tenant Mismatch! Request Tenant: ${targetTenant}, Actual User Tenant: ${user.tenant_id}`);
    } else {
        console.log('✅ Tenant match.');
    }

    if (!user.pin_hash) {
        console.warn('⚠️ User has no PIN.');
    } else if (user.pin_hash !== '1234') {
        console.warn(`⚠️ User PIN is '${user.pin_hash}', but request password was '1234'. mismatch?`);
    } else {
        console.log('✅ User PIN matches request password (1234).');
    }

    if (!user.password_hash) {
        console.error('❌ Password Hash is MISSING (Backfill needed).');
    } else {
        console.log('✅ Password Hash exists.');
    }

}

diagnoseUser();
