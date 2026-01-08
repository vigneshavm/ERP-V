import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';

// Load env vars
dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
    console.error('Error: VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY is not defined in .env file.');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function extractSchema() {
    try {
        console.log('Connecting to Supabase...');

        // 1. Get all tables in public schema using RPC or direct query if allowed
        // Note: Supabase JS client doesn't have a direct way to query information_schema 
        // unless you've created an RPC for it. We'll try to list common tables first
        // and get their definitions, or use a general SQL execution if available.

        console.log('Attempting to fetch table list via RPC or common tables...');

        // Let's try to query the schema via a simple SQL execution if possible, 
        // but Supabase client usually doesn't allow raw SQL unless via RPC.
        // We'll try to fetch definitions for tables we know exist from the codebase.

        const commonTables = [
            'tenants', 'branches', 'customers', 'products', 'employees',
            'transactions', 'cheques', 'sales', 'purchase_orders',
            'labor_payments', 'tenant_users', 'roles', 'tenant_business_info',
            'tenant_company_details', 'tenant_tax_details', 'tenant_banking_details',
            'tenant_system_config', 'tenant_integrations', 'tenant_user_visual_identity'
        ];

        let schemaContent = '-- Extracted Database Schema (Inferred via Supabase Client)\n\n';

        for (const tableName of commonTables) {
            console.log(`Checking table: ${tableName}...`);

            // We can't easily get the CREATE TABLE statement via the JS client without RPC.
            // But we can try to fetch one row to see the structure and types.
            const { data, error } = await supabase.from(tableName).select('*').limit(1);

            if (error) {
                console.warn(`Could not access table ${tableName}: ${error.message}`);
                continue;
            }

            schemaContent += `-- Table: ${tableName}\n`;
            if (data && data.length > 0) {
                const sampleRow = data[0];
                schemaContent += `CREATE TABLE ${tableName} (\n`;
                const cols = Object.keys(sampleRow).map(key => `    ${key} ${typeof sampleRow[key] === 'object' ? 'JSONB' : 'TEXT'}`);
                schemaContent += cols.join(',\n');
                schemaContent += '\n);\n\n';
            } else {
                schemaContent += `-- Table ${tableName} exists but is empty or schema information is unavailable.\n\n`;
            }
        }

        const outputPath = path.resolve(process.cwd(), 'DB', 'extracted_schema_simplified.sql');
        fs.writeFileSync(outputPath, schemaContent);

        console.log(`Simplified schema extracted to ${outputPath}`);
        console.log('NOTE: For a full schema dump, please provide the DATABASE_URL (postgres connection string) in .env');
    } catch (err) {
        console.error('Extraction Failed:', err);
    }
}

extractSchema();
