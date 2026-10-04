// Read-only: why does the backend report "'TRY_CONVERT' is not a recognized built-in function name"?
//   cd backend && node scripts/dbCompatCheck.cjs
require('dotenv').config({ path: '.env' });
const sql = require('mssql');
const logins = [
  ['read login', process.env.TEXTILESOFT_DB_USER, process.env.TEXTILESOFT_DB_PASSWORD],
  ['write login', process.env.TEXTILESOFT_DB_WRITE_USER, process.env.TEXTILESOFT_DB_WRITE_PASSWORD],
];
(async () => {
  for (const [label, user, password] of logins) {
    if (!user) { console.log(label + ': not configured'); continue; }
    console.log('\n== ' + label);
    let p;
    try {
      p = await sql.connect({ server: process.env.TEXTILESOFT_DB_HOST, port: +process.env.TEXTILESOFT_DB_PORT,
        database: process.env.TEXTILESOFT_DB_NAME, user, password,
        options: { encrypt: process.env.TEXTILESOFT_DB_ENCRYPT === 'true', trustServerCertificate: true } });
    } catch (e) { console.log('  connect failed:', e.message); continue; }
    const q = async (name, text) => { try { const r = await p.request().query(text); console.log('  ' + name.padEnd(14) + 'OK  ', JSON.stringify(r.recordset[0])); } catch (e) { console.log('  ' + name.padEnd(14) + 'FAIL', e.message); } };
    await q('version', "select cast(serverproperty('ProductVersion') as varchar(30)) v, db_name() db");
    await q('compat level', "select name, compatibility_level from sys.databases where name = db_name()");
    await q('TRY_CAST', "select try_cast('12' as int) x");
    await q('TRY_CONVERT', "select try_convert(int, '12') x");
    await p.close();
  }
  process.exit(0);
})().catch(e => { console.log('ERR', e.message); process.exit(1); });
