
-- Test pgcrypto verification manually
DO $$
DECLARE
    v_hash TEXT := '$2b$10$su37lPki/RM3WRbcBT3d1ekmdk8GI6pNJzUSHHVkrOaHDN9.dWPN.';
    v_match BOOLEAN;
BEGIN
    v_match := (v_hash = crypt('1234', v_hash));
    
    IF v_match THEN
        RAISE NOTICE '✅ Password Match Successful!';
    ELSE
        RAISE NOTICE '❌ Password Match Failed!';
        RAISE NOTICE 'Expected: %', v_hash;
        RAISE NOTICE 'Computed: %', crypt('1234', v_hash);
    END IF;
END $$;
