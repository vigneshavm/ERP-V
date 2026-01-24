-- Add new columns for separate attributes
ALTER TABLE products ADD COLUMN IF NOT EXISTS size TEXT;
ALTER TABLE products ADD COLUMN IF NOT EXISTS color TEXT;

-- Migration to extract Size/Color from Name for existing Textile products
-- Pattern assumption: "Name (Color - Size)" or "Name (Material Color)"
-- This is a best-effort extraction based on the seed format

-- 1. Extract Color (First part inside brackets)
UPDATE products 
SET color = split_part(substring(name from '\((.+)\)'), ' ', 1)
WHERE sector = 'Textile' AND name LIKE '%(%)%' AND color IS NULL;

-- 2. Extract Size (Second part inside brackets after - )
UPDATE products 
SET size = split_part(substring(name from '\((.+)\)'), '- ', 2)
WHERE sector = 'Textile' AND name LIKE '%(% - %)' AND size IS NULL;

-- 3. Cleanup Name (Remove the suffix)
UPDATE products
SET name = split_part(name, ' (', 1)
WHERE sector = 'Textile' AND name LIKE '%(%)%';
