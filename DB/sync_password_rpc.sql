-- RPC to synchronize Supabase Auth password with tenant_users table
-- This version is more robust and attempts to match by both user_id and email.
-- Run this in your Supabase SQL Editor

CREATE OR REPLACE FUNCTION sync_tenant_user_password(
    p_user_id UUID,
    p_email TEXT,
    p_new_password TEXT
)
RETURNS JSONB AS $$
DECLARE
    v_updated_rows INTEGER;
BEGIN
    -- Update based on ID first
    UPDATE tenant_users
    SET password_hash = crypt(p_new_password, gen_salt('bf'))
    WHERE id = p_user_id::TEXT OR id = p_user_id::TEXT; -- Handle potential text casting issues
    
    GET DIAGNOSTICS v_updated_rows = ROW_COUNT;

    -- If no rows found by ID, try matching by email
    IF v_updated_rows = 0 AND p_email IS NOT NULL THEN
        UPDATE tenant_users
        SET password_hash = crypt(p_new_password, gen_salt('bf'))
        WHERE email = p_email;
        
        GET DIAGNOSTICS v_updated_rows = ROW_COUNT;
    END IF;

    IF v_updated_rows > 0 THEN
        RETURN jsonb_build_object(
            'success', true, 
            'message', 'Terminal credentials synchronized successfully (' || v_updated_rows || ' users updated)'
        );
    ELSE
        RETURN jsonb_build_object(
            'success', false, 
            'message', 'User not found in terminal registry (checked ID and email)'
        );
    END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
