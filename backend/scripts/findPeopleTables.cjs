// Read-only: finds where salespeople / employees are stored in SSS_copy.
//   cd backend && node scripts/findPeopleTables.cjs
require('dotenv').config({ path: '.env', quiet: true });
const sql = require('mssql');
(async () => {
  const p = await sql.connect({ server: process.env.TEXTILESOFT_DB_HOST, port: +process.env.TEXTILESOFT_DB_PORT,
    database: process.env.TEXTILESOFT_DB_NAME, user: process.env.TEXTILESOFT_DB_USER, password: process.env.TEXTILESOFT_DB_PASSWORD,
    options: { encrypt: process.env.TEXTILESOFT_DB_ENCRYPT === 'true', trustServerCertificate: true } });
  const pat = "(salesman|sales_man|slman|sls_man|employee|emp|staff|worker|salary|wage|attend|agent|commission)";
  const cols = await p.request().query(`select TABLE_NAME t, COLUMN_NAME c from INFORMATION_SCHEMA.COLUMNS where TABLE_SCHEMA='dbo' and (TABLE_NAME like '%salesman%' or TABLE_NAME like '%slman%' or TABLE_NAME like '%emp%' or TABLE_NAME like '%staff%' or TABLE_NAME like '%worker%' or TABLE_NAME like '%salary%' or TABLE_NAME like '%wage%' or TABLE_NAME like '%attend%' or TABLE_NAME like '%agent%' or TABLE_NAME like '%commission%' or COLUMN_NAME like '%salesman%' or COLUMN_NAME like '%slman%' or COLUMN_NAME like '%sls_man%' or COLUMN_NAME like '%employee%') order by 1`);
  const byT = {}; for (const r of cols.recordset) (byT[r.t] ||= []).push(r.c);
  for (const [t, cs] of Object.entries(byT)) {
    const n = await p.request().query(`select count(*) c from [dbo].[${t}]`);
    console.log(`\n== ${t}  rows=${n.recordset[0].c}\n   columns: ${cs.join(', ')}`);
    if (n.recordset[0].c > 0) console.log((await p.request().query(`select top 3 * from [dbo].[${t}]`)).recordset);
  }
  console.log('\n== distinct sls_man codes used on bill lines');
  console.log((await p.request().query(`select top 20 sls_man, count(*) lines from salsntry group by sls_man order by 2 desc`)).recordset);
  process.exit(0);
})().catch(e => { console.log('ERR', e.message); process.exit(1); });
