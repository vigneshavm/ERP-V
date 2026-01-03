import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config({ path: '.env' });

const supabaseUrl = process.env.VITE_SUPABASE_URL?.trim();
// Trying the 41-char key from seed_db.js as a prioritized attempt
const supabaseKey = 'sb_secret_mymXX85Prjih44tu2jst1g_mnL1bR6z';
// If that fails, the script will fall back to anon key in the code below

if (!supabaseUrl || !supabaseKey) {
    console.error('Missing Supabase URL or Key in .env');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function inspect() {
    console.log('Inspecting Supabase Database using SDK...');
    console.log('URL:', supabaseUrl);

    try {
        // Try to fetch a known table to verify authentication
        console.log('Testing connection with "tenants" table...');
        const { data: tenants, error: tError } = await supabase
            .from('tenants')
            .select('id, name')
            .limit(5);

        if (tError) {
            console.error('Connection Test Failed:', tError.message);
            console.error('Error Details:', JSON.stringify(tError, null, 2));
            // If service role failed, try anon key if different
            if (process.env.VITE_SUPABASE_ANON_KEY && process.env.VITE_SUPABASE_ANON_KEY !== process.env.SUPABASE_SERVICE_ROLE_KEY) {
                console.log('Retrying with Anon Key...');
                const anonSupabase = createClient(supabaseUrl, process.env.VITE_SUPABASE_ANON_KEY.trim());
                const { data: anonTenants, error: aError } = await anonSupabase.from('tenants').select('id, name').limit(5);
                if (aError) console.error('Anon Key Test Failed:', aError.message);
                else console.log('Successfully connected with Anon Key. Found tenants:', anonTenants.length);
            }
        } else {
            console.log('Successfully connected! Found tenants:', tenants.length);
            tenants.forEach(t => console.log(`- [${t.id}] ${t.name}`));
        }

        // To list all tables, we'd normally need a custom function or search the OpenAPI spec
        // But since we want to "List all tables", let's try to fetch the OpenAPI spec via fetch but with the same logic SDK uses
        console.log('\nFetching OpenAPI specification for table list...');
        const response = await fetch(`${supabaseUrl}/rest/v1/`, {
            headers: {
                'apikey': supabaseKey,
                'Authorization': `Bearer ${supabaseKey}`
            }
        });

        if (response.ok) {
            const spec = await response.json();
            const tableList = Object.keys(spec.definitions || {});
            console.log('\n--- Tables ---');
            tableList.sort().forEach(t => console.log(`- ${t}`));

            const tablesToInspect = ['products', 'vendors', 'tenants'];
            tablesToInspect.forEach(tableName => {
                if (spec.definitions[tableName]) {
                    console.log(`\n--- ${tableName.toUpperCase()} Columns ---`);
                    const properties = spec.definitions[tableName].properties;
                    Object.keys(properties).forEach(col => {
                        const type = properties[col].format || properties[col].type;
                        const isNullable = properties[col].description?.includes('nullable');
                        console.log(`- ${col} (${type})${isNullable ? ' [Nullable]' : ''}`);
                    });
                }
            });
        } else {
            console.error('Failed to fetch OpenAPI spec:', response.status, await response.text());
        }

    } catch (error) {
        console.error('Critical Error:', error.message);
    }
}

inspect();
