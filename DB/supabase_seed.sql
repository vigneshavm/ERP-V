-- ERP Supabase Seed Data
-- Run this AFTER the schema sync to populate your tables.

-- Clear existing data
TRUNCATE tenants, customers, products, employees, branches, transactions, cheques, sales, purchase_orders, labor_payments RESTART IDENTITY CASCADE;

-- 1. Insert Tenants
INSERT INTO tenants (id, name, subdomain, modules, is_active, region, sector, theme, layout, domain, primary_color, locations)
VALUES
('866d5ae4-82ee-48c6-9f4c-28df8c541701', 'Big Bazaar', 'big-bazaar', '["POS", "INVENTORY", "FINANCE"]', true, '{"currency": "INR", "currencySymbol": "₹", "dateFormat": "DD/MM/YYYY"}', 'General', 'light', 'standard', 'bigbazaar.com', '#f97316', '[{"city": "Mumbai", "branches": [{"id": "br-bb-mum-01", "name": "Lower Parel", "city": "Mumbai", "address": "Phoenix Mills"}, {"id": "br-bb-mum-02", "name": "Vashi", "city": "Mumbai", "address": "Inorbit Mall"}]}, {"city": "Bangalore", "branches": [{"id": "br-bb-blr-01", "name": "Indiranagar", "city": "Bangalore", "address": "100 Feet Road"}]}]'),
('866d5ae4-82ee-48c6-9f4c-28df8c541702', 'Apollo Pharmacy', 'apollo', '["POS", "INVENTORY"]', true, '{"currency": "INR", "currencySymbol": "₹", "dateFormat": "DD/MM/YYYY"}', 'Pharmacy', 'light', 'compact', 'apollopharmacy.in', '#059669', '[{"city": "Chennai", "branches": [{"id": "br-ap-chn-01", "name": "Adyar", "city": "Chennai", "address": "LB Road"}]}]'),
('866d5ae4-82ee-48c6-9f4c-28df8c541703', 'Reliance Digital', 'reliance-digital', '["POS", "INVENTORY", "STOREFRONT"]', true, '{"currency": "INR", "currencySymbol": "₹", "dateFormat": "DD/MM/YYYY"}', 'Electronics', 'dark', 'compact', 'reliancedigital.in', '#e11d48', '[{"city": "Chennai", "branches": [{"id": "br-rel-chn-01", "name": "Anna Nagar", "city": "Chennai", "address": "2nd Avenue"}]}]'),
('866d5ae4-82ee-48c6-9f4c-28df8c541704', 'Reliance Smart Point', 'reliance-smart', '["POS", "INVENTORY", "DAILY"]', true, '{"currency": "INR", "currencySymbol": "₹", "dateFormat": "DD/MM/YYYY"}', 'Grocery', 'light', 'standard', 'reliancesmart.in', '#16a34a', '[{"city": "Hyderabad", "branches": [{"id": "br-rs-hyd-01", "name": "Banjara Hills", "city": "Hyderabad", "address": "Road No 12"}]}]'),
('866d5ae4-82ee-48c6-9f4c-28df8c541705', 'Spar Hypermarket', 'spar', '["POS", "INVENTORY", "FINANCE", "PURCHASE"]', true, '{"currency": "INR", "currencySymbol": "₹", "dateFormat": "DD/MM/YYYY"}', 'Supermarket', 'light', 'standard', 'sparindia.com', '#dc2626', '[{"city": "Bangalore", "branches": [{"id": "br-sp-blr-01", "name": "Mantri Square", "city": "Bangalore", "address": "Malleswaram"}]}]'),
('866d5ae4-82ee-48c6-9f4c-28df8c541706', 'Pothys', 'pothys', '["POS", "INVENTORY", "SALES"]', true, '{"currency": "INR", "currencySymbol": "₹", "dateFormat": "DD/MM/YYYY"}', 'Textile', 'light', 'standard', 'pothys.com', '#7c2d12', '[{"city": "Chennai", "branches": [{"id": "br-po-chn-01", "name": "T Nagar", "city": "Chennai", "address": "Panagal Park"}]}]'),
('866d5ae4-82ee-48c6-9f4c-28df8c541707', 'Poorvika Mobiles', 'poorvika', '["POS", "STOREFRONT"]', true, '{"currency": "INR", "currencySymbol": "₹", "dateFormat": "DD/MM/YYYY"}', 'Mobile Shop', 'dark', 'compact', 'poorvika.com', '#ea580c', '[{"city": "Chennai", "branches": [{"id": "br-pv-chn-01", "name": "Chromepet", "city": "Chennai", "address": "GST Road"}]}]');

-- 2. Insert Customers
INSERT INTO customers (id, tenant_id, name, phone, points)
VALUES
('c1e13880-3c1a-4d92-9a3d-9d41498b5801', '866d5ae4-82ee-48c6-9f4c-28df8c541701', 'Walk-in Customer', '000-000-0000', 0),
('c1e13880-3c1a-4d92-9a3d-9d41498b5802', '866d5ae4-82ee-48c6-9f4c-28df8c541702', 'Walk-in Customer', '000-000-0000', 0),
('c1e13880-3c1a-4d92-9a3d-9d41498b5803', '866d5ae4-82ee-48c6-9f4c-28df8c541703', 'Walk-in Customer', '000-000-0000', 0),
('c2e13880-3c1a-4d92-9a3d-9d41498b5806', '866d5ae4-82ee-48c6-9f4c-28df8c541706', 'Rajesh Kumar', '9876543210', 450);

-- 3. Insert Products
INSERT INTO products (id, tenant_id, branch_id, sku, name, category, price, cost, stock, sector, barcode, product_type)
VALUES
('a1e13880-3c1a-4d92-9a3d-9d41498b5801', '866d5ae4-82ee-48c6-9f4c-28df8c541701', 'br-bb-mum-01', 'BB-STAT-NB', 'Classmate Notebook A4', 'Stationery', 150, 90, 500, 'General', '4001', 'Stationery'),
('a1e13880-3c1a-4d92-9a3d-9d41498b5802', '866d5ae4-82ee-48c6-9f4c-28df8c541701', 'br-bb-mum-01', 'BB-BEV-COKE', 'Coca Cola 1.25L', 'Beverage', 95, 70, 200, 'General', '4002', 'FMCG'),
('a2e13880-3c1a-4d92-9a3d-9d41498b5801', '866d5ae4-82ee-48c6-9f4c-28df8c541702', 'br-ap-chn-01', 'MED-DOLO-650', 'Dolo 650', 'Analgesic', 30, 18, 1200, 'Pharmacy', '5001', 'Medicine');

-- 4. Insert Employees
INSERT INTO employees (id, tenant_id, branch_id, name, role, daily_rate, sector, system_role, pin, phone_number)
VALUES
('e1e13880-3c1a-4d92-9a3d-9d41498b5801', '866d5ae4-82ee-48c6-9f4c-28df8c541701', 'br-bb-mum-01', 'Vikram (Helper)', 'Helper', 500, 'General', 'Staff', '2222', '9988776655');
