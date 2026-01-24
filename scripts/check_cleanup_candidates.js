
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env') });

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

async function listAllTables() {
    console.log('Listing all public tables...');

    // Querying pg_tables view via RPC or if we can access it. 
    // Since we might not have direct SQL access, we'll try to guess/check well known ones or see if we can use a known rpc (unlikely).
    // Alternative: We can't list all tables easily with supabase-js unless we have a specific RPC.
    // BUT we can check specific candidates we suspect: employees, settings, profiles.

    const suspects = ['employees', 'settings', 'profiles', 'app_settings', 'user_roles', 'app_users'];

    for (const table of suspects) {
        const { error } = await supabase.from(table).select('*').limit(0);
        if (!error) {
            console.log(`[EXISTING LEGACY CANDIDATE] ${table}`);
        } else {
            // console.log(`[NOT FOUND] ${table} (${error.message})`);
        }
    }

    // Also verify new tables exist to be safe we don't drop them
    const newTables = ['tenant_users', 'tenants', 'branches'];
    for (const table of newTables) {
        const { error } = await supabase.from(table).select('*').limit(0);
        if (!error) {
            console.log(`[VERIFIED NEW] ${table}`);
        }
    }
}

listAllTables();
