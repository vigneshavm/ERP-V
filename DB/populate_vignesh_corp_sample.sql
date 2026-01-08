-- Populate sample data for Vignesh Corp (aad0aa5c-4b09-451c-ac14-c299959f4a48)

-- 1. Business Info
INSERT INTO tenant_business_info (tenant_id, business_type, nature_of_business, trade_description)
VALUES ('aad0aa5c-4b09-451c-ac14-c299959f4a48', 'Retail & Tech', 'Retail', 'Multi-vertical enterprise dealing in electronics and software services.')
ON CONFLICT (tenant_id) DO UPDATE SET
    business_type = EXCLUDED.business_type,
    nature_of_business = EXCLUDED.nature_of_business,
    trade_description = EXCLUDED.trade_description;

-- 2. Company Details
INSERT INTO tenant_company_details (tenant_id, address_line1, address_line2, city, state, state_code, country, pincode, phone, email, website)
VALUES (
    'aad0aa5c-4b09-451c-ac14-c299959f4a48',
    '123, Tech Plaza',
    'GST Road, Guindy',
    'Chennai',
    'Tamil Nadu',
    '33',
    'India',
    '600032',
    '+91 98765 43210',
    'admin@vigneshcorp.com',
    'https://vigneshcorp.com'
)
ON CONFLICT (tenant_id) DO UPDATE SET
    address_line1 = EXCLUDED.address_line1,
    city = EXCLUDED.city,
    state = EXCLUDED.state,
    phone = EXCLUDED.phone,
    email = EXCLUDED.email;

-- 3. Tax Details
INSERT INTO tenant_tax_details (tenant_id, tax_system, gstin, pan, is_gst_enabled, is_einvoice_enabled, is_eway_bill_enabled)
VALUES ('aad0aa5c-4b09-451c-ac14-c299959f4a48', 'GST', '33ABCDE1234F1Z5', 'ABCDE1234F', true, true, true)
ON CONFLICT (tenant_id) DO UPDATE SET
    gstin = EXCLUDED.gstin,
    pan = EXCLUDED.pan,
    is_gst_enabled = EXCLUDED.is_gst_enabled;

-- 4. Banking Details
INSERT INTO tenant_banking_details (tenant_id, bank_name, account_number, account_holder_name, ifsc, books_start_date, financial_year_closing)
VALUES ('aad0aa5c-4b09-451c-ac14-c299959f4a48', 'HDFC Bank', '50100456123789', 'Vignesh Corp Private Limited', 'HDFC0001234', '2023-04-01', 'Mar-31')
ON CONFLICT (tenant_id) DO UPDATE SET
    bank_name = EXCLUDED.bank_name,
    account_number = EXCLUDED.account_number,
    ifsc = EXCLUDED.ifsc;

-- 5. System Configuration
INSERT INTO tenant_system_config (tenant_id, is_pos_enabled, is_inventory_enabled, is_loyalty_enabled, is_multibranch_enabled, pricing_mode)
VALUES ('aad0aa5c-4b09-451c-ac14-c299959f4a48', true, true, true, true, 'EXCLUSIVE')
ON CONFLICT (tenant_id) DO UPDATE SET
    is_pos_enabled = EXCLUDED.is_pos_enabled,
    pricing_mode = EXCLUDED.pricing_mode;

-- 6. Integrations
INSERT INTO tenant_integrations (tenant_id, payment_gateway_key, sms_provider_key, email_provider_key, webhook_url)
VALUES ('aad0aa5c-4b09-451c-ac14-c299959f4a48', 'rzp_live_vignesh_123', 'msg91_api_key_456', 'sendgrid_api_key_789', 'https://api.vigneshcorp.com/webhooks/supabase')
ON CONFLICT (tenant_id) DO UPDATE SET
    payment_gateway_key = EXCLUDED.payment_gateway_key,
    webhook_url = EXCLUDED.webhook_url;
