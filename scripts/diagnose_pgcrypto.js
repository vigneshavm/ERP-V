
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env') });

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

async function diagnose() {
    console.log('Diagnosing pgcrypto installation...');

    // 1. Check pg_available_extensions (if accessible) or just try running a function with schema qualification

    // Try calling public.gen_salt
    const { data: d1, error: e1 } = await supabase.rpc('login_tenant_user', {
        p_tenant_id: '00000000-0000-0000-0000-000000000000', // Dummy
        p_identity: 'x',
        p_password: 'x'
    });
    // This fails as we know.

    // Let's try to find extension schema
    const { data: extData, error: extError } = await supabase
        .from('pg_extension')
        .select('extname, extnamespace')
        .eq('extname', 'pgcrypto')
    //.single(); // Might not work with API unless system tables exposed (usually not).

    // Instead, let's try raw select if possible? No.

    // Let's try to infer by creating a temporary function or just checking known schemas.
    // Actually, we can just run a query that calls `public.crypt` and returns result.
    // Since we have no generic sql runner via simple client, we have to rely on what we can do.

    // Check if 'extensions' schema exists?
    // We can list tables/functions?

    // ALTERNATIVE: Use the error message "hint".
    // Error: function crypt(text, text) does not exist.

    // This usually means either:
    // 1. Extension not installed.
    // 2. Not in search path.
    // 3. Arguments mismatch. (crypt takes text, text).

    // Let's assume it IS installed because earlier backfill worked?
    // ALL BACKFILL SQL had: `UPDATE tenant_users SET password_hash = crypt(pin_hash, gen_salt('bf')) ...`
    // Did the *user* run that successfully?
    // In Step 1228, Backfill Verified: ✅ Backfill Verified: password_hash is populated with bcrypt hash.
    // SO THE EXTENSION IS INSTALLED AND ACCESSIBLE via the UPDATE call.

    // Differences:
    // The UPDATE was run as raw SQL in SQL Editor (User context).
    // The FUNCTION is `SECURITY DEFINER`.
    // The FUNCTION sets `search_path = public, extensions`.

    // IF the backfill worked, likely pgcrypto functions are in `public` or `extensions`.
    // IF `search_path = public, extensions` failed, maybe it is in `auth` schema? (Supabase puts some stuff there).
    // Or maybe the user installed it in `public`.

    // Let's return the `search_path` and `current_schema()` from within the function to debug.
    console.log('Cannot confirm schema via JS client easily. Assuming public or extensions.');

    // But verify_login_security.js logs:
    /*
    Test 1: Valid Credentials (PIN: 1111)
    ❌ RPC Error (Success Test): {
    code: '42883',
    ... message: 'function crypt(text, text) does not exist'
    }
    */

    // If it was in `public`, `search_path = public, extensions` would find it.
    // If it was in `extensions`, it should find it.

    // Maybe `extensions` schema DOES NOT EXIST and `pgcrypto` is in `public`?
    // If I set `search_path = public, extensions`, and `extensions` is missing, it ignores it.
    // So if `pgcrypto` is in `public`, it should work.

    // WAIT. `pgcrypto` functions are `gen_salt(text)` and `crypt(text, text)`.

    // Is it possible the user ran the backfill logic but NOT the `create extension`?
    // But the backfill worked. So `crypt` exists.

    // Is it possible `current_setting('search_path')` inside function is overriding it?
    // We set it explicitly.

    // Maybe the user installed it in `auth` or `vault`?
    // Commonly Supabase installs extensions in `extensions` schema.

    // Let's assume the user might have installed it in `public` but purely accidentally?

    console.log('Diagnostic finished (Inconclusive via script, will iterate on SQL).');
}

diagnose();
