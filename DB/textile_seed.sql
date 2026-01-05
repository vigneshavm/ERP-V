DO $$
DECLARE
    v_tenant_id UUID := '80aa164e-685b-46f0-9ef1-5af54b57b8a0';
    v_branch_id UUID;
BEGIN
    -- 1. Get or Create Branch
    SELECT id INTO v_branch_id FROM branches WHERE tenant_id = v_tenant_id;
    
    IF v_branch_id IS NULL THEN
        INSERT INTO branches (tenant_id, name, city, address)
        VALUES (v_tenant_id, 'Textile Main', 'Chennai', 'T Nagar')
        RETURNING id INTO v_branch_id;
    END IF;

    -- 2. Insert Products
    INSERT INTO products (id, tenant_id, branch_id, sku, name, category, product_type, price, cost, stock, sector, barcode, composition, unit, brand, hsn_code, gst_percentage, size, color)
    VALUES
    ('46059fb9-dc34-4a41-b06f-42289c0be036', v_tenant_id, v_branch_id, 'BIB-WOM-DRE-WS-972', 'Biba Dress Material', 'Womens Wear', 'Dress Material', 539, 396, 75, 'Textile', '785055042656', 'Polyester', 'Piece', 'Biba', '6204', 5, 'S', 'White'),
    ('3b715aef-72fe-4e31-9f93-b6d859fa0f55', v_tenant_id, v_branch_id, 'MAN-FAB-SUI-WNULL-976', 'Manyavar Suiting', 'Fabrics', 'Suiting', 1599, 1146, 52, 'Textile', '998188172967', 'Polyester', 'Meter', 'Manyavar', '6204', 12, NULL, 'White'),
    ('68c17670-07bf-4e78-9e63-cda31780517f', v_tenant_id, v_branch_id, 'LIV-MEN-SHI-W40-101', 'Liva Shirts', 'Mens Wear', 'Shirts', 1989, 1374, 91, 'Textile', '336829792011', 'Denim', 'Piece', 'Liva', '6203', 12, '40', 'White'),
    ('0415392d-9486-444a-a438-e6fd63b72c91', v_tenant_id, v_branch_id, 'W-WOM-SAR-BXL-481', 'W Sarees', 'Womens Wear', 'Sarees', 2319, 1852, 98, 'Textile', '427018898952', 'Polyester', 'Piece', 'W', '6204', 12, 'XL', 'Blue'),
    ('20b12fc1-4687-4309-ab36-d8d4924c87bd', v_tenant_id, v_branch_id, 'AUR-WOM-KUR-BS-398', 'Aurelia Kurtis', 'Womens Wear', 'Kurtis', 699, 532, 28, 'Textile', '999882239474', 'Linen', 'Piece', 'Aurelia', '6204', 5, 'S', 'Black'),
    ('100f283d-3fd0-4054-938a-3604b7f8303d', v_tenant_id, v_branch_id, 'SIY-WOM-KUR-GXXL-755', 'Siyaram Kurtis', 'Womens Wear', 'Kurtis', 1039, 762, 59, 'Textile', '337090886129', 'Polyester', 'Piece', 'Siyaram', '6204', 12, 'XXL', 'Grey'),
    ('17ec4440-e221-4f8a-9f88-444f23b2046f', v_tenant_id, v_branch_id, 'RAY-WOM-DRE-WXL-371', 'Raymond Dress Material', 'Womens Wear', 'Dress Material', 469, 360, 24, 'Textile', '904533038622', 'Polyester', 'Piece', 'Raymond', '6204', 5, 'XL', 'White'),
    ('2e40cd61-e0ca-4cb7-97dd-6320072b2260', v_tenant_id, v_branch_id, 'BIB-MEN-DEN-G40-529', 'Biba Denim', 'Mens Wear', 'Denim', 1289, 905, 30, 'Textile', '333552097801', 'Cotton', 'Piece', 'Biba', '6203', 12, '40', 'Green'),
    ('8330af63-146f-4886-9040-d7904a6013a7', v_tenant_id, v_branch_id, 'VAN-MEN-SHI-GXL-460', 'Van Heusen Shirts', 'Mens Wear', 'Shirts', 2149, 1729, 39, 'Textile', '302821262973', 'Cotton', 'Piece', 'Van Heusen', '6203', 12, 'XL', 'Grey'),
    ('a9762145-6679-4592-8869-d4191c94a50d', v_tenant_id, v_branch_id, 'BIB-WOM-KUR-GXXL-504', 'Biba Kurtis', 'Womens Wear', 'Kurtis', 1889, 1459, 17, 'Textile', '543997184209', 'Polyester', 'Piece', 'Biba', '6204', 12, 'XXL', 'Green'),
    ('16fc9444-6729-450f-bc7e-2211604a11b6', v_tenant_id, v_branch_id, 'ARV-MEN-DEN-W44-517', 'Arvind Denim', 'Mens Wear', 'Denim', 1339, 1022, 60, 'Textile', '166668744046', 'Silk', 'Piece', 'Arvind', '6203', 12, '44', 'White'),
    ('4d0c9269-e0d0-4ac0-83ae-f6e07bed12e7', v_tenant_id, v_branch_id, 'LOU-MEN-PAN-G44-775', 'Louis Philippe Pants', 'Mens Wear', 'Pants', 609, 444, 46, 'Textile', '759882963391', 'Polyester', 'Piece', 'Louis Philippe', '6203', 5, '44', 'Grey'),
    ('3c180e04-d079-4a94-bfd4-3408035ed788', v_tenant_id, v_branch_id, 'W-MEN-DEN-N44-239', 'W Denim', 'Mens Wear', 'Denim', 619, 461, 80, 'Textile', '991316104193', 'Silk', 'Piece', 'W', '6203', 5, '44', 'Navy'),
    ('32128e46-f94e-4f52-87c1-dae9613ed8d2', v_tenant_id, v_branch_id, 'LIV-MEN-PAN-BXL-437', 'Liva Pants', 'Mens Wear', 'Pants', 1989, 1502, 63, 'Textile', '431420790693', 'Linen', 'Piece', 'Liva', '6203', 12, 'XL', 'Beige'),
    ('b4a3952a-9e19-482f-acda-61198424294b', v_tenant_id, v_branch_id, 'MAN-FAB-SUI-NNULL-867', 'Manyavar Suiting', 'Fabrics', 'Suiting', 1519, 1023, 76, 'Textile', '414844332159', 'Polyester', 'Meter', 'Manyavar', '6204', 12, NULL, 'Navy'),
    ('0f94d3f3-9d18-4448-933e-eafa35db6cdd', v_tenant_id, v_branch_id, 'LOU-WOM-LEG-YXXL-673', 'Louis Philippe Leggings', 'Womens Wear', 'Leggings', 859, 616, 75, 'Textile', '540955683457', 'Khadi', 'Piece', 'Louis Philippe', '6204', 5, 'XXL', 'Yellow'),
    ('8f0e5728-66d4-4a4b-8aa1-d00923055819', v_tenant_id, v_branch_id, 'RAY-WOM-DRE-N40-620', 'Raymond Dress Material', 'Womens Wear', 'Dress Material', 529, 396, 52, 'Textile', '933090740924', 'Linen', 'Piece', 'Raymond', '6204', 5, '40', 'Navy'),
    ('9fe76735-fd84-469b-92eb-6dcd60af253f', v_tenant_id, v_branch_id, 'AUR-MEN-T-S-MXXL-585', 'Aurelia T-Shirts', 'Mens Wear', 'T-Shirts', 1919, 1515, 34, 'Textile', '269550346045', 'Linen', 'Piece', 'Aurelia', '6203', 12, 'XXL', 'Maroon'),
    ('041abfa2-7e0f-4e00-84c1-4246db983d5a', v_tenant_id, v_branch_id, 'VAN-WOM-KUR-WS-843', 'Van Heusen Kurtis', 'Womens Wear', 'Kurtis', 639, 528, 48, 'Textile', '593504859067', 'Polyester', 'Piece', 'Van Heusen', '6204', 5, 'S', 'White'),
    ('20b6e159-002f-4a0b-9c76-f83134aa66b1', v_tenant_id, v_branch_id, 'VAN-MEN-SHI-B38-164', 'Van Heusen Shirts', 'Mens Wear', 'Shirts', 519, 429, 36, 'Textile', '842407283307', 'Denim', 'Piece', 'Van Heusen', '6203', 5, '38', 'Blue'),
    ('364684c3-b4a5-485a-a309-c1f0b098f98d', v_tenant_id, v_branch_id, 'MAN-FAB-SUI-GNULL-845', 'Manyavar Suiting', 'Fabrics', 'Suiting', 1989, 1555, 30, 'Textile', '109968417537', 'Polyester', 'Meter', 'Manyavar', '6204', 12, NULL, 'Grey'),
    ('100a75f5-cd01-443b-bd9f-7c15cf98b8c2', v_tenant_id, v_branch_id, 'LOU-FAB-SHI-GNULL-818', 'Louis Philippe Shirting', 'Fabrics', 'Shirting', 2829, 2195, 76, 'Textile', '970222046467', 'Cotton', 'Meter', 'Louis Philippe', '6204', 12, NULL, 'Green'),
    ('975fc3c9-026d-473d-9860-e41c4bd6975a', v_tenant_id, v_branch_id, 'LIV-FAB-SHI-MNULL-147', 'Liva Shirting', 'Fabrics', 'Shirting', 1479, 1149, 18, 'Textile', '716300438343', 'Denim', 'Meter', 'Liva', '6204', 12, NULL, 'Maroon'),
    ('50a417dd-7756-43d9-95e2-2db389bd3b5c', v_tenant_id, v_branch_id, 'LOU-FAB-SHI-GNULL-397', 'Louis Philippe Shirting', 'Fabrics', 'Shirting', 599, 447, 98, 'Textile', '164478347898', 'Silk', 'Meter', 'Louis Philippe', '6204', 5, NULL, 'Green'),
    ('a7638703-a128-444e-9d2c-35cd02444630', v_tenant_id, v_branch_id, 'MAN-FAB-SHI-MNULL-556', 'Manyavar Shirting', 'Fabrics', 'Shirting', 909, 706, 21, 'Textile', '998463994350', 'Rayon', 'Meter', 'Manyavar', '6204', 5, NULL, 'Maroon'),
    ('7154944d-2a1e-4581-9f93-1b9195a63901', v_tenant_id, v_branch_id, 'BIB-WOM-DRE-WS-929', 'Biba Dress Material', 'Womens Wear', 'Dress Material', 549, 459, 23, 'Textile', '466820549463', 'Khadi', 'Piece', 'Biba', '6204', 5, 'S', 'White'),
    ('6615ae84-33d6-40c4-bbeb-32f184a260c1', v_tenant_id, v_branch_id, 'LIV-WOM-SAR-RXL-223', 'Liva Sarees', 'Womens Wear', 'Sarees', 1989, 1347, 49, 'Textile', '823260267507', 'Linen', 'Piece', 'Liva', '6204', 12, 'XL', 'Red'),
    ('2544b614-c282-4386-a589-2d6748ba9043', v_tenant_id, v_branch_id, 'SIY-MEN-PAN-G38-235', 'Siyaram Pants', 'Mens Wear', 'Pants', 2779, 1876, 32, 'Textile', '397719681165', 'Polyester', 'Piece', 'Siyaram', '6203', 12, '38', 'Green'),
    ('33622b65-fe48-4491-92a5-d0af604fdf7a', v_tenant_id, v_branch_id, 'MAN-FAB-SHI-MNULL-542', 'Manyavar Shirting', 'Fabrics', 'Shirting', 539, 428, 71, 'Textile', '802466931719', 'Rayon', 'Meter', 'Manyavar', '6204', 5, NULL, 'Maroon'),
    ('7e5e483b-d199-4eff-ab2d-f0c3b3662390', v_tenant_id, v_branch_id, 'LOU-MEN-T-S-W40-746', 'Louis Philippe T-Shirts', 'Mens Wear', 'T-Shirts', 1799, 1394, 74, 'Textile', '865570733435', 'Linen', 'Piece', 'Louis Philippe', '6203', 12, '40', 'White');
END $$;
