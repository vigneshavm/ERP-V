
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env') });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('Missing Supabase environment variables');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function verifyAuthRefactor() {
    console.log('Verifying Authentication Refactor...');

    try {
        // 1. Check if tenant_users table exists and has daily_rate
        console.log('Checking tenant_users schema...');
        const { data: userData, error: userError } = await supabase
            .from('tenant_users')
            .select('daily_rate, mobile, role_id')
            .limit(1);

        if (userError) {
            console.error('Error querying tenant_users:', userError);
            if (userError.code === 'PGRST100') { // Column not found? or Table?
                console.error('Likely missing table or column.');
            }
        } else {
            console.log('✓ tenant_users table accessible');
            // If select succeeded, columns exist
            console.log('✓ daily_rate, mobile, role_id columns exist');
        }

        // 2. Check Roles
        console.log('Checking roles table...');
        const { data: roles, error: roleError } = await supabase
            .from('roles')
            .select('*')
            .limit(5);

        if (roleError) {
            console.error('Error querying roles:', roleError);
        } else {
            console.log(`✓ Roles table accessible (Found ${roles.length} roles)`);
        }

        // 3. Test RPC login (Simulate)
        // We need a valid tenant code or ID.
        // Let's list tenants first.
        const { data: tenants } = await supabase.from('tenants').select('id, name').limit(1);
        if (tenants && tenants.length > 0) {
            const tenant = tenants[0];
            console.log(`Testing with Tenant: ${tenant.name} (${tenant.id})`);

            // Use a known user or skip if we don't know credentials
            // We won't test actual login success without a known password, but we can verify the function exists.
            // Calling rpc with invalid args should return a specific error, not "function not found".

            const { error: rpcError } = await supabase.rpc('login_tenant_user', {
                p_tenant_id: tenant.id,
                p_identity: '0000000000',
                p_password: 'wrongpassword'
            });

            if (rpcError && rpcError.code === '42883') { // Undefined function
                console.error('X login_tenant_user function NOT found!');
            } else {
                console.log('✓ login_tenant_user function exists (RPC call attempted)');
            }
        }

    } catch (err) {
        console.error('Unexpected error:', err);
    }
}

verifyAuthRefactor();
