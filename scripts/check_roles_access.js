
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env') });

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

async function checkRolesAccess() {
    console.log('Testing access to roles table with ANON key...');
    const { data: roles, error } = await supabase.from('roles').select('*');

    if (error) {
        console.error('❌ Error fetching roles:', error.message);
        if (error.code === '42501') console.error('   -> RLS Policy violation?');
    } else {
        console.log('✅ Roles fetched successfully:', roles.length, 'roles found.');
        console.table(roles);
    }
}

checkRolesAccess();
