
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env') });

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

async function inspectRoles() {
    console.log('Inspecting Roles...');
    const { data: roles, error } = await supabase.from('roles').select('*');
    if (error) console.error(error);
    console.table(roles);

    // Also check the specific user's role_id and what it resolves to
    const userId = 'fed89443-a38d-441e-9ec8-bfb6c50f0437';
    const { data: user } = await supabase.from('tenant_users').select('*, role:roles(*)').eq('id', userId).single();
    console.log('User Role Data:', user?.role);
}

inspectRoles();
