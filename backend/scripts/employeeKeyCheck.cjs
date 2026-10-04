// Read-only: is dbo.newemployee.code a usable unique key? Run on the PC that hosts SSS_copy:
//   cd backend && node scripts/employeeKeyCheck.cjs
require('dotenv').config({ path: '.env', quiet: true });
const sql = require('mssql');
(async () => {
  const p = await sql.connect({ server: process.env.TEXTILESOFT_DB_HOST, port: +process.env.TEXTILESOFT_DB_PORT,
    database: process.env.TEXTILESOFT_DB_NAME, user: process.env.TEXTILESOFT_DB_USER, password: process.env.TEXTILESOFT_DB_PASSWORD,
    options: { encrypt: process.env.TEXTILESOFT_DB_ENCRYPT === 'true', trustServerCertificate: true } });
  const q = async (t) => (await p.request().query(t)).recordset;
  console.log('columns:', await q(`select c.name, t.name type, c.max_length, c.is_nullable, c.is_identity from sys.columns c join sys.types t on t.user_type_id=c.user_type_id where c.object_id=object_id('dbo.newemployee') and c.name in ('code','e_id','name_eng','id_cd_nu','at_cd','att_card_nu') order by c.name`));
  console.log('constraints/indexes:', await q(`select i.name, i.is_unique, i.is_primary_key, col_name(ic.object_id, ic.column_id) col from sys.indexes i join sys.index_columns ic on ic.object_id=i.object_id and ic.index_id=i.index_id where i.object_id=object_id('dbo.newemployee')`));
  console.log('rows:', (await q(`select count(*) n from dbo.newemployee`))[0].n);
  console.log('blank code:', (await q(`select count(*) n from dbo.newemployee where ltrim(rtrim(isnull(code,'')))=''`))[0].n);
  console.log('duplicate codes:', await q(`select ltrim(rtrim(code)) code, count(*) n from dbo.newemployee group by ltrim(rtrim(code)) having count(*)>1`));
  console.log('duplicate e_id:', await q(`select e_id, count(*) n from dbo.newemployee group by e_id having count(*)>1`));
  console.log('duplicate names:', await q(`select ltrim(rtrim(name_eng)) name, count(*) n from dbo.newemployee group by ltrim(rtrim(name_eng)) having count(*)>1`));
  process.exit(0);
})().catch(e => { console.log('ERR', e.message); process.exit(1); });
