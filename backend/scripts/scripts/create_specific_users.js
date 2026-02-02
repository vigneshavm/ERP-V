
import { createClient } from '@supabase/supabase-js';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env') });

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

const USERS = [
    { name: 'Madhan', mobile: '8489182201' },
    { name: 'Manikandan', mobile: '9699448180' }
];

const TENANT_ID = 'aad0aa5c-4b09-451c-ac14-c299959f4a48';
const ROLE_ID = '06c56f28-535e-474d-b494-fe3e9c709cb2'; // Staff Role
const DEFAULT_PASSWORD = '1234';

async function createUsers() {
    console.log('Creating users...');

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(DEFAULT_PASSWORD, salt);

    for (const user of USERS) {
        // Check if user exists
        const { data: existingUsers, error: fetchError } = await supabase
            .from('tenant_users')
            .select('id')
            .eq('tenant_id', TENANT_ID)
            .eq('mobile', user.mobile);

        let error;

        if (existingUsers && existingUsers.length > 0) {
            // Update
            const { error: updateError } = await supabase
                .from('tenant_users')
                .update({
                    full_name: user.name,
                    email: `${user.name.toLowerCase()}@example.com`,
                    password_hash: passwordHash,
                    role_id: ROLE_ID,
                    pin_hash: passwordHash
                })
                .eq('id', existingUsers[0].id);
            error = updateError;
            if (!error) console.log(`✅ Updated user: ${user.name}`);
        } else {
            // Insert
            const { error: insertError } = await supabase
                .from('tenant_users')
                .insert({
                    tenant_id: TENANT_ID,
                    full_name: user.name,
                    mobile: user.mobile,
                    email: `${user.name.toLowerCase()}@example.com`,
                    password_hash: passwordHash,
                    role_id: ROLE_ID,
                    pin_hash: passwordHash
                });
            error = insertError;
            if (!error) console.log(`✅ Created user: ${user.name}`);
        }

        if (error) {
            console.error(`❌ Failed to process ${user.name}:`, error.message);
        }
    }
}

createUsers();
