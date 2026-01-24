
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env') });

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

async function checkLegacyColumns() {
    console.log('Checking legacy employees table schema...');

    // We can't query information_schema easily with anon key usually, but we can try selecting a raw row
    const { data, error } = await supabase.from('employees').select('*').limit(1);

    if (error) {
        console.error('Error querying employees:', error);
    } else if (data && data.length > 0) {
        console.log('Found row:', Object.keys(data[0]));
    } else {
        console.log('Table exists but is empty? Or select failed silently.');
        // Try to rely on the error message history or known schema
    }
}

checkLegacyColumns();
