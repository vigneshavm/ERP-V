-- RPC to initialize or activate e-commerce for a tenant
-- Sets a 14-day trial and default configuration

CREATE OR REPLACE FUNCTION init_tenant_ecommerce(p_tenant_id UUID)
RETURNS JSONB AS $$
DECLARE
    v_existing_id UUID;
    v_trial_end TIMESTAMPTZ;
BEGIN
    v_trial_end := NOW() + INTERVAL '14 days';
    
    -- Check if config already exists
    SELECT id INTO v_existing_id FROM tenant_ecommerce WHERE tenant_id = p_tenant_id;
    
    IF v_existing_id IS NOT NULL THEN
        -- Re-activate if exists but disabled
        UPDATE tenant_ecommerce 
        SET is_enabled = TRUE, 
            updated_at = NOW() 
        WHERE id = v_existing_id;
    ELSE
        -- Create new config
        INSERT INTO tenant_ecommerce (
            tenant_id, 
            is_enabled, 
            plan, 
            trial_ends_at, 
            payment_gateway_enabled,
            customer_portal_enabled,
            order_management_enabled
        ) VALUES (
            p_tenant_id,
            TRUE,
            'STARTER',
            v_trial_end,
            FALSE, -- Features locked by default on Starter
            FALSE,
            TRUE   -- Basic order management enabled
        );
    END IF;

    -- Also update the main system config flag in the relevant table if necessary
    -- Assuming a tenant_system_config table or similar exists as per schema
    -- UPDATE tenant_system_config SET is_ecommerce_enabled = TRUE WHERE tenant_id = p_tenant_id;

    RETURN jsonb_build_object(
        'success', TRUE,
        'message', 'E-commerce activated successfully',
        'trial_ends_at', v_trial_end
    );
EXCEPTION WHEN OTHERS THEN
    RETURN jsonb_build_object(
        'success', FALSE,
        'message', SQLERRM
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
