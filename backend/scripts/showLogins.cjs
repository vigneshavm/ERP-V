// Read-only. Prints each Textilesoft login (dbo.newuser): username, stored password, Textilesoft rights and the ERP role
// (same rule as the ERP: owner if the user is in TEXTILESOFT_OWNER_USERS or the rights are in TEXTILESOFT_OWNER_RIGHTS, else staff).
// Output goes to THIS terminal only; nothing is written to a file or sent anywhere. Do not paste it into chats or tickets.
//   cd backend && node scripts/showLogins.cjs
require('dotenv').config({ path: '.env', quiet: true });
const sql = require('mssql');
const list = (v, d = '') => String(v ?? d).split(',').map(s => s.trim().toLowerCase()).filter(Boolean);
const roleFor = (id, rights) =>
  list(process.env.TEXTILESOFT_OWNER_USERS).includes(String(id).trim().toLowerCase()) ||
  list(process.env.TEXTILESOFT_OWNER_RIGHTS, 'admin').includes(String(rights).trim().toLowerCase()) ? 'owner' : 'staff';
(async () => {
  const p = await sql.connect({ server: process.env.TEXTILESOFT_DB_HOST, port: +process.env.TEXTILESOFT_DB_PORT,
    database: process.env.TEXTILESOFT_DB_NAME, user: process.env.TEXTILESOFT_DB_USER, password: process.env.TEXTILESOFT_DB_PASSWORD,
    options: { encrypt: process.env.TEXTILESOFT_DB_ENCRYPT === 'true', trustServerCertificate: true } });
  const cols = (await p.request().query(`select COLUMN_NAME c from INFORMATION_SCHEMA.COLUMNS where TABLE_SCHEMA='dbo' and TABLE_NAME='newuser'`)).recordset.map(r => r.c);
  const pw = cols.filter(c => /pass|pwd/i.test(c));
  if (!pw.length) { console.log('No password column found. Columns:', cols.join(', ')); process.exit(0); }
  const has = (c) => cols.some(x => x.toLowerCase() === c);
  const sel = ['[user_id]', ...pw.map(c => `[${c}]`), has('rights') ? '[rights]' : "'' as rights", has('name') ? '[name]' : "'' as name"];
  const rows = (await p.request().query(`select distinct ${sel.join(', ')} from dbo.newuser order by 1`)).recordset;
  console.table(rows.map(r => {
    const out = { username: String(r.user_id).trim() };
    for (const c of pw) out[c] = r[c];
    out.name = String(r.name ?? '').trim();
    out.rights = String(r.rights ?? '').trim();
    out.erpRole = roleFor(r.user_id, r.rights);
    return out;
  }));
  process.exit(0);
})().catch(e => { console.log('ERR', e.message); process.exit(1); });
