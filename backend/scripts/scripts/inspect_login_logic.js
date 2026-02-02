
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env') });

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

async function inspectFunction() {
    console.log('Inspecting login_tenant_user function...');

    // We can query pg_proc but need to join with pg_namespace etc.
    // Or just use the rpc call to test bad passwords to see behavior.

    // Let's test negative case first.
    const { data: failResult } = await supabase.rpc('login_tenant_user', {
        p_tenant_id: 'aad0aa5c-4b09-451c-ac14-c299959f4a48', // Tenant ID from previous run
        p_identity: '55ff37f5-a0a',
        p_password: 'WRONGPASSWORD'
    });
    console.log('Negative Test (Wrong Password):', JSON.stringify(failResult));

    // If negative test fails (returns success: false), then authentication is actually checking something.
    // Converting '1111' to hash matches '1111' if it was stored as plain text in password_hash?
    // But password_hash was NULL.

    // Let's check the user row again, maybe I missed a column or aliasing.
    const { data: users } = await supabase
        .from('tenant_users')
        .select('id, password_hash, pin_hash')
        .eq('full_name', 'kamal')
        .single();

    console.log('User Row:', users);
}

inspectFunction();
