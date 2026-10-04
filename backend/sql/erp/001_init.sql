-- backend/sql/erp/001_init.sql
-- Foundation for the `erp` schema (ERP-only data, alongside Textilesoft's `dbo` in the same database).
-- Applied by `npm run erp:migrate` (backend/src/scripts/erpMigrate.ts), never by hand. Idempotent.

IF NOT EXISTS (SELECT 1 FROM sys.schemas WHERE name = 'erp') EXEC('CREATE SCHEMA erp');
GO

IF OBJECT_ID('erp.schema_migrations') IS NULL
CREATE TABLE erp.schema_migrations (
  version INT NOT NULL PRIMARY KEY,
  name NVARCHAR(200) NOT NULL,
  checksum CHAR(64) NOT NULL,
  applied_at DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME());
GO

-- Wave 1 (auth): refresh tokens for Textilesoft-backed logins. Stores a hash only, never the raw token.
IF OBJECT_ID('erp.refresh_token') IS NULL
CREATE TABLE erp.refresh_token (
  id BIGINT IDENTITY PRIMARY KEY,
  user_id NVARCHAR(64) NOT NULL,          -- dbo.newuser user id
  token_hash CHAR(64) NOT NULL UNIQUE,
  expires_at DATETIME2 NOT NULL,
  revoked_at DATETIME2 NULL,
  created_by_ip NVARCHAR(64) NULL,
  user_agent NVARCHAR(400) NULL,
  created_at DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME());
GO
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_refresh_token_user' AND object_id = OBJECT_ID('erp.refresh_token'))
CREATE INDEX IX_refresh_token_user ON erp.refresh_token(user_id);
GO
