
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env') });

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

const TENANT_ID = 'aad0aa5c-4b09-451c-ac14-c299959f4a48';
const USER_MOBILE = '8489182201'; // Madhan
const PASSWORD = '1234';

async function verifyLogin() {
    console.log(`Attempting login for Tenant: ${TENANT_ID}, User: ${USER_MOBILE}`);

    const { data, error } = await supabase
        .rpc('login_tenant_user', {
            p_tenant_id: TENANT_ID,
            p_identity: USER_MOBILE,
            p_password: PASSWORD
        });

    if (error) {
        console.error('❌ RPC Error:', error);
    } else {
        console.log('RPC Result:', JSON.stringify(data, null, 2));
    }
}

verifyLogin();
