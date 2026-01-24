-- Update login_tenant_user to return role_id and branch_id
-- Run this in your Supabase SQL Editor

CREATE OR REPLACE FUNCTION login_tenant_user(
    p_tenant_id UUID, 
    p_identity TEXT, 
    p_password TEXT
)
RETURNS JSONB AS $$
DECLARE
    v_user RECORD;
    v_password_valid BOOLEAN;
BEGIN
    -- 1. Find User by tenant_id AND (mobile OR email)
    SELECT * INTO v_user
    FROM tenant_users
    WHERE tenant_id = p_tenant_id
    AND (
        mobile = p_identity 
        OR email = p_identity
    );

    -- 2. Check existence
    IF v_user IS NULL THEN
        RETURN jsonb_build_object('success', false, 'message', 'Invalid credentials');
    END IF;

    -- 3. Verify Password (using pgcrypto)
    -- Assumes password_hash is a bcrypt hash (starts with $2)
    v_password_valid := (v_user.password_hash = crypt(p_password, v_user.password_hash));

    IF v_password_valid IS FALSE THEN
         RETURN jsonb_build_object('success', false, 'message', 'Invalid credentials');
    END IF;

    -- 4. Return Success with User Data including role_id
    RETURN jsonb_build_object(
        'success', true,
        'message', 'Login successful',
        'user', jsonb_build_object(
            'id', v_user.id,
            'tenant_id', v_user.tenant_id,
            'full_name', v_user.full_name,
            'email', v_user.email,
            'mobile', v_user.mobile,
            'role_id', v_user.role_id,
            'branch_id', (to_jsonb(v_user)->>'branch_id')
        )
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
