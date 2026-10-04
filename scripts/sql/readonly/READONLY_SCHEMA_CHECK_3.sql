-- READ-ONLY. Run in SSMS with SSS_copy selected. Changes nothing.
SELECT 'newcustomer' t, COUNT(*) n FROM dbo.newcustomer
UNION ALL SELECT 'customercmyname', COUNT(*) FROM dbo.customercmyname;
-- which rows exist in customercmyname but not in newcustomer (by card number)?
SELECT COUNT(*) AS only_in_customercmyname FROM dbo.customercmyname c
WHERE NOT EXISTS (SELECT 1 FROM dbo.newcustomer n WHERE n.card_number = c.card_number);
SELECT TOP 5 sl_nu, card_number, eng_name, mobile_nu, points FROM dbo.customercmyname ORDER BY TRY_CONVERT(int, sl_nu);
SELECT TOP 5 sl_nu, card_number, eng_name, mobile_nu, points FROM dbo.newcustomer;
-- permissions the ERP write login really has on these tables (not the SSMS user)
SELECT pr.name AS principal, o.name AS [table], p.permission_name, p.state_desc
FROM sys.database_permissions p
JOIN sys.database_principals pr ON pr.principal_id = p.grantee_principal_id
JOIN sys.objects o ON o.object_id = p.major_id
WHERE pr.name IN ('erp_pos_writer','erp_readonly')
  AND o.name IN ('newcustomer','customercmyname','mrpratechange','sales2','purentrydetails','stockdetails')
ORDER BY pr.name, o.name, p.permission_name;
-- do old bills carry the customer card/name the legacy page rewrites?
SELECT TOP 5 cus_card, cus_name, mbl_no FROM dbo.sales2 WHERE ISNULL(cus_card,'') <> '' ORDER BY 1;
