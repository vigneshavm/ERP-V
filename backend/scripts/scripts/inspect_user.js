
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env') });

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

const TENANT_ID = 'aad0aa5c-4b09-451c-ac14-c299959f4a48';
const USER_MOBILE = '8489182201';

async function inspectUser() {
    const { data, error } = await supabase
        .from('tenant_users')
        .select('*')
        .eq('tenant_id', TENANT_ID)
        .eq('mobile', USER_MOBILE);

    if (error) {
        console.error('Error fetching user:', error);
    } else {
        console.log('User Record:', JSON.stringify(data, null, 2));
    }
}

inspectUser();
