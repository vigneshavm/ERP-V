import dotenv from "dotenv";
import sql from "mssql";

dotenv.config({ path: "C:/Users/avmvi/Project/ERP/backend/.env" });

const base = {
  server: process.env.TEXTILESOFT_DB_HOST,
  port: process.env.TEXTILESOFT_DB_PORT ? Number(process.env.TEXTILESOFT_DB_PORT) : undefined,
  database: process.env.TEXTILESOFT_DB_NAME || "SSS",
  connectionTimeout: Number(process.env.TEXTILESOFT_DB_TIMEOUT_MS || 15000),
  options: {
    encrypt: ["1", "true", "yes"].includes((process.env.TEXTILESOFT_DB_ENCRYPT || "").toLowerCase()),
    trustServerCertificate: !["0", "false", "no"].includes((process.env.TEXTILESOFT_DB_TRUST_CERT || "true").toLowerCase()),
  },
};

const identities = [
  { name: "read", user: process.env.TEXTILESOFT_DB_USER, password: process.env.TEXTILESOFT_DB_PASSWORD },
  { name: "write", user: process.env.TEXTILESOFT_DB_WRITE_USER, password: process.env.TEXTILESOFT_DB_WRITE_PASSWORD },
];

for (const identity of identities) {
  if (!identity.user || !identity.password) {
    console.log(JSON.stringify({ role: identity.name, configured: false }));
    continue;
  }
  const pool = new sql.ConnectionPool({ ...base, user: identity.user, password: identity.password });
  try {
    await pool.connect();
    const result = await pool.request().query(`
      SELECT DB_NAME() AS databaseName,
             SUSER_SNAME() AS loginName,
             USER_NAME() AS databaseUser,
             HAS_PERMS_BY_NAME(DB_NAME(), 'DATABASE', 'CREATE TABLE') AS canCreateTable,
             HAS_PERMS_BY_NAME(DB_NAME(), 'DATABASE', 'ALTER ANY SCHEMA') AS canAlterSchema,
             HAS_PERMS_BY_NAME('dbo.sales2', 'OBJECT', 'INSERT') AS canInsertSalesHeader,
             HAS_PERMS_BY_NAME('dbo.salsntry', 'OBJECT', 'INSERT') AS canInsertSalesLine,
             HAS_PERMS_BY_NAME('dbo.newproduct', 'OBJECT', 'UPDATE') AS canUpdateProduct
    `);
    console.log(JSON.stringify({ role: identity.name, configured: true, ...result.recordset[0] }));
  } catch (error) {
    console.log(JSON.stringify({ role: identity.name, configured: true, connected: false, error: error instanceof Error ? error.message : String(error) }));
    process.exitCode = 1;
  } finally {
    await pool.close().catch(() => undefined);
  }
}
