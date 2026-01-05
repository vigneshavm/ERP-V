
-- Reset passwords for specific users using pgcrypto native hashing
-- This ensures compatibility with the login RPC which uses crypt()

UPDATE tenant_users
SET 
    password_hash = crypt('1234', gen_salt('bf')),
    pin_hash = crypt('1234', gen_salt('bf'))
WHERE mobile IN ('8489182201', '9699448180')
AND tenant_id = 'aad0aa5c-4b09-451c-ac14-c299959f4a48';
