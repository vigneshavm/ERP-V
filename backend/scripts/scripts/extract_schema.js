import postgres from 'postgres';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';

// Load env vars
dotenv.config();

const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
    console.error('Error: DATABASE_URL is not defined in .env file.');
    process.exit(1);
}

const sql = postgres(DATABASE_URL, {
    ssl: { rejectUnauthorized: false },
    max: 1
});

async function extractSchema() {
    try {
        console.log('Connecting to database...');

        // 1. Get all tables in public schema
        const tables = await sql`
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_schema = 'public' 
            AND table_type = 'BASE TABLE';
        `;

        let schemaContent = '-- Extracted Database Schema\n\n';

        for (const table of tables) {
            const tableName = table.table_name;
            console.log(`Extracting schema for table: ${tableName}...`);

            // 2. Get column information
            const columns = await sql`
                SELECT column_name, data_type, is_nullable, column_default, character_maximum_length
                FROM information_schema.columns
                WHERE table_name = ${tableName}
                AND table_schema = 'public'
                ORDER BY ordinal_position;
            `;

            schemaContent += `CREATE TABLE ${tableName} (\n`;

            const columnDefs = columns.map(col => {
                let def = `    ${col.column_name} ${col.data_type}`;
                if (col.character_maximum_length) {
                    def += `(${col.character_maximum_length})`;
                }
                if (col.is_nullable === 'NO') {
                    def += ' NOT NULL';
                }
                if (col.column_default) {
                    def += ` DEFAULT ${col.column_default}`;
                }
                return def;
            });

            schemaContent += columnDefs.join(',\n');
            schemaContent += '\n);\n\n';
        }

        // 3. Get view definitions
        const views = await sql`
            SELECT table_name, view_definition
            FROM information_schema.views
            WHERE table_schema = 'public';
        `;

        for (const view of views) {
            schemaContent += `-- View: ${view.table_name}\n`;
            schemaContent += `CREATE OR REPLACE VIEW ${view.table_name} AS\n${view.view_definition}\n\n`;
        }

        const outputPath = path.resolve(process.cwd(), 'DB', 'extracted_schema.sql');
        fs.writeFileSync(outputPath, schemaContent);

        console.log(`Schema successfully extracted to ${outputPath}`);
    } catch (err) {
        console.error('Extraction Failed:', err);
    } finally {
        await sql.end();
    }
}

extractSchema();
