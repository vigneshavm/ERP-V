
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env') });

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

async function verifyManualReset() {
    const CORRECT_TENANT_ID = 'aad0aa5c-4b09-451c-ac14-c299959f4a48'; // Vignesh Corp
    const WRONG_TENANT_ID = '7ea0aa94-a0e7-448e-ab47-39838da6c466';   // The one from your error log
    const IDENTITY = '8148256362';
    const PASSWORD = '1234';

    console.log('--- Verifying Manual Reset ---');

    // 1. Try with the WRONG Tenant ID (To reproduce your error)
    console.log(`\n1. Testing with WRONG Tenant ID: ${WRONG_TENANT_ID}`);
    const { data: failResult } = await supabase.rpc('login_tenant_user', {
        p_tenant_id: WRONG_TENANT_ID,
        p_identity: IDENTITY,
        p_password: PASSWORD
    });
    console.log('Result:', failResult);
    // Expected: { success: false, message: 'Invalid credentials' }

    // 2. Try with the CORRECT Tenant ID (Vignesh Corp)
    console.log(`\n2. Testing with CORRECT Tenant ID: ${CORRECT_TENANT_ID}`);
    const { data: successResult, error: successError } = await supabase.rpc('login_tenant_user', {
        p_tenant_id: CORRECT_TENANT_ID,
        p_identity: IDENTITY,
        p_password: PASSWORD
    });

    if (successError) {
        console.error('❌ RPC Error:', successError);
    } else if (successResult && successResult.success) {
        console.log('✅ SUCCESS! User logged in.');
        console.log('User Data:', successResult.user);
    } else {
        console.log('❌ Failed even with correct ID. Password reset might not have run?');
        console.log('Result:', successResult);
    }
}

verifyManualReset();
