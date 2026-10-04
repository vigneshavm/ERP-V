// Read-only: lists the Textilesoft login accounts (dbo.newuser). Password columns are never selected or printed.
//   cd backend && node scripts/listLogins.cjs
require('dotenv').config({ path: '.env', quiet: true });
const sql = require('mssql');
(async () => {
  const p = await sql.connect({ server: process.env.TEXTILESOFT_DB_HOST, port: +process.env.TEXTILESOFT_DB_PORT,
    database: process.env.TEXTILESOFT_DB_NAME, user: process.env.TEXTILESOFT_DB_USER, password: process.env.TEXTILESOFT_DB_PASSWORD,
    options: { encrypt: process.env.TEXTILESOFT_DB_ENCRYPT === 'true', trustServerCertificate: true } });
  const cols = (await p.request().query(`select COLUMN_NAME c from INFORMATION_SCHEMA.COLUMNS where TABLE_SCHEMA='dbo' and TABLE_NAME='newuser'`)).recordset
    .map(r => r.c).filter(c => !/pass|pwd|secret|token|hash/i.test(c));
  console.log('columns shown:', cols.join(', '));
  const rows = (await p.request().query(`select ${cols.map(c => `[${c}]`).join(', ')} from dbo.newuser`)).recordset;
  console.log(`\n${rows.length} rows`);
  console.table(rows);
  process.exit(0);
})().catch(e => { console.log('ERR', e.message); process.exit(1); });
