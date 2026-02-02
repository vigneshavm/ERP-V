
import postgres from 'postgres';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// ESM dirname fix
const __filename = fileURLToPath(import.meta.url); 0
const __dirname = path.dirname(__filename);

// Load env vars
dotenv.config();

const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
    console.error('\x1b[31m%s\x1b[0m', 'Error: DATABASE_URL is not defined in .env file.');
    console.error('Please add your Supabase Connection String (Transaction Mode) to .env to run migrations.');
    console.error('Example: DATABASE_URL=postgres://postgres:[PASSWORD]@db.[PROJECT_REF].supabase.co:5432/postgres');
    process.exit(1);
}

const sql = postgres(DATABASE_URL, {
    ssl: { rejectUnauthorized: false }, // Supabase requires SSL, usually self-signed or CA specific
    max: 1
});

const MIGRATION_FILE = 'add_assigned_counter_id.sql';

async function runMigration() {
    try {
        console.log(`Loading migration file: ${MIGRATION_FILE}...`);

        const filePath = path.resolve(process.cwd(), MIGRATION_FILE);
        if (!fs.existsSync(filePath)) {
            throw new Error(`Migration file not found at ${filePath}`);
        }

        const query = fs.readFileSync(filePath, 'utf-8');

        console.log('Executing SQL...');
        await sql.unsafe(query);

        console.log('\x1b[32m%s\x1b[0m', 'Migration executed successfully!');
    } catch (err) {
        console.error('\x1b[31m%s\x1b[0m', 'Migration Failed:');
        console.error(err);
        process.exit(1);
    } finally {
        await sql.end();
    }
}

runMigration();
