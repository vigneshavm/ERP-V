import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config({ path: '.env' });

const supabaseUrl = process.env.VITE_SUPABASE_URL?.trim();
const supabaseKey = 'sb_secret_mymXX85Prjih44tu2jst1g_mnL1bR6z';

const supabase = createClient(supabaseUrl, supabaseKey);

async function findBranch() {
    const tenantId = '80aa164e-685b-46f0-9ef1-5af54b57b8a0';
    console.log(`Checking tenant: ${tenantId}`);

    const { data: tenant, error: tErr } = await supabase
        .from('tenants')
        .select('*')
        .eq('id', tenantId)
        .single();

    if (tErr) {
        console.error('Tenant Error:', tErr.message);
    } else {
        console.log(`Tenant exists: ${tenant.name}`);

        const { data: branches, error: bErr } = await supabase
            .from('branches')
            .select('*')
            .eq('tenant_id', tenantId);

        if (bErr) {
            console.error('Branch Error:', bErr.message);
        } else if (branches.length === 0) {
            console.log('No branches found. Creating default "Main Branch"...');
            const { data: newBranch, error: cErr } = await supabase
                .from('branches')
                .insert({ tenant_id: tenantId, name: 'Main Branch', city: 'Default', address: 'Default' })
                .select()
                .single();

            if (cErr) console.error('Create Branch Error:', cErr.message);
            else console.log(`Created branch: [${newBranch.id}] ${newBranch.name}`);
        } else {
            console.log('Found branches:');
            branches.forEach(b => console.log(`- [${b.id}] ${b.name}`));
        }
    }
}

findBranch();
