
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env') });

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

async function verifyDataMigration() {
    console.log('Verifying Data Migration V4...');

    // 1. Check Tenant
    const { data: tenant, error: tenantError } = await supabase
        .from('tenants')
        .select('id, name')
        .eq('subdomain', 'vignesh')
        .single();

    if (tenantError || !tenant) {
        console.error('❌ Tenant "Vignesh Corp" not found:', tenantError);
        return;
    }
    console.log(`✓ Tenant Found: ${tenant.name} (${tenant.id})`);

    // 2. Check Roles
    const { data: roles, error: rolesError } = await supabase
        .from('roles')
        .select('id, code')
        .eq('code', 'staff'); // Check for one of the seeded roles

    if (rolesError) {
        console.error('❌ Error checking roles:', rolesError);
    } else {
        console.log(`✓ Roles check passed. Found ${roles.length} roles matching 'staff'.`);
    }

    // 3. Check Tenant Users (Migrated Employees)
    const { data: users, error: usersError } = await supabase
        .from('tenant_users')
        .select('id, full_name, mobile, daily_rate, assigned_branch_id')
        .eq('tenant_id', tenant.id)
        .limit(5);

    if (usersError) {
        console.error('❌ Error fetching tenant_users:', usersError);
    } else {
        console.log(`✓ Found ${users.length} migrated users.`);
        if (users.length > 0) {
            console.log('  Sample User:', JSON.stringify(users[0], null, 2));
            if (users[0].mobile && users[0].mobile.length > 0) {
                console.log('  ✓ Mobile number populated.');
            } else {
                console.error('  ❌ Mobile number MISSING/NULL.');
            }
            if (users[0].daily_rate !== undefined) {
                console.log('  ✓ Daily Rate column exists.');
            }
        } else {
            console.warn('  ! No users found. Migration might not have run or source table was empty.');
        }
    }

    // 4. Check Branch
    const { data: branches, error: branchError } = await supabase
        .from('branches')
        .select('id, name')
        .eq('tenant_id', tenant.id);

    if (branchError) {
        console.error('❌ Error checking branches:', branchError);
    } else {
        console.log(`✓ Found ${branches.length} branches.`);
    }

}

verifyDataMigration();
