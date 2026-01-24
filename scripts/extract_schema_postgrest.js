import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';

// Load env vars
dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const useKey = supabaseServiceKey || supabaseAnonKey;

if (!supabaseUrl || !useKey) {
    console.error('Error: Required Supabase credentials not found in .env file.');
    process.exit(1);
}

const url = supabaseUrl.replace(/\/$/, '') + '/rest/v1/';

async function extractFullSchema() {
    try {
        console.log(`Connecting to PostgREST at ${url}...`);
        if (supabaseServiceKey) console.log('Using Service Role Key for higher privilege...');

        // Try fetching with specific headers for PostgREST metadata
        const response = await fetch(`${url}?apikey=${useKey}`, {
            headers: {
                'Authorization': `Bearer ${useKey}`,
                'apikey': useKey,
                'Accept-Profile': 'public',
                'Accept': 'application/openapi+json'
            }
        });

        if (!response.ok) {
            const errorBody = await response.text();
            throw new Error(`Failed to fetch schema: ${response.status} ${response.statusText}\nBody: ${errorBody}`);
        }

        const openapi = await response.json();
        const definitions = openapi.definitions;

        if (!definitions) {
            throw new Error('No definitions found in OpenAPI spec.');
        }

        let schemaContent = '-- Full Database Schema Structure (Extracted via PostgREST OpenAPI)\n\n';

        for (const [tableName, definition] of Object.entries(definitions)) {
            console.log(`Processing table: ${tableName}...`);

            schemaContent += `CREATE TABLE ${tableName} (\n`;

            const properties = definition.properties;
            const required = definition.required || [];

            if (properties) {
                const columnDefs = Object.entries(properties).map(([colName, colDef]) => {
                    let type = colDef.type || 'text';
                    if (colDef.format) {
                        type = colDef.format;
                    }

                    let def = `    ${colName} ${type.toUpperCase()}`;

                    if (required.includes(colName)) {
                        def += ' NOT NULL';
                    }

                    if (colDef.description) {
                        def += ` -- ${colDef.description}`;
                    }

                    return def;
                });

                schemaContent += columnDefs.join(',\n');
            }

            schemaContent += '\n);\n\n';
        }

        const outputPath = path.resolve(process.cwd(), 'DB', 'full_schema_structure.sql');
        fs.writeFileSync(outputPath, schemaContent);

        console.log(`Full schema structure successfully extracted to ${outputPath}`);
    } catch (err) {
        console.error('Extraction Failed:', err);
    }
}

extractFullSchema();
