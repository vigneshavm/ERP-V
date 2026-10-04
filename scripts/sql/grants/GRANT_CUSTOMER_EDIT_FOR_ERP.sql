-- Run ONCE in SSMS as an admin, database SSS_copy. Permission changes only -- no table or column is created or altered.
-- The ERP no longer grants rights itself (portable deployment), so this must be done by hand
-- (and again after a database restore, which wipes the ERP's database users).
USE SSS_copy;
GRANT UPDATE ON dbo.newcustomer  TO erp_pos_writer;   -- customer mobile / card / name change
GRANT INSERT ON dbo.newcustomer  TO erp_pos_writer;   -- new customer
GRANT INSERT ON dbo.agentdetail  TO erp_pos_writer;   -- New Agent (M05)
GRANT UPDATE ON dbo.sales2       TO erp_pos_writer;   -- old bills' card/name rewrite (already granted if bills save)
-- Optional, only if you want rate-change history later:
-- GRANT INSERT ON dbo.mrpratechange TO erp_pos_writer;
