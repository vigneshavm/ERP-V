-- 005: which supplier (Textilesoft business name) belongs to which ERP supplier group.
-- Replaces the MongoDB Supplier.supplierGroup field used by Reports > Party > Purchase by Party Group.
-- Additive, ERP-owned (erp schema only); nothing in dbo is touched.
IF OBJECT_ID('erp.supplier_group_member') IS NULL
CREATE TABLE erp.supplier_group_member (
  supplier_name NVARCHAR(200) NOT NULL,
  group_id BIGINT NOT NULL,
  created_at DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
  updated_at DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
  CONSTRAINT PK_erp_supplier_group_member PRIMARY KEY (supplier_name),
  CONSTRAINT FK_erp_supplier_group_member_group FOREIGN KEY (group_id) REFERENCES erp.supplier_group(id) ON DELETE CASCADE
);
GO
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_erp_supplier_group_member_group' AND object_id = OBJECT_ID('erp.supplier_group_member'))
CREATE INDEX IX_erp_supplier_group_member_group ON erp.supplier_group_member(group_id);
GO
