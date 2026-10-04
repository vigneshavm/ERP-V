// Read-only check of the tables used by the Cash & Bank screen. Run on the PC that hosts SSS_copy:
//   cd backend && node scripts/cashBankCheck.cjs
require('dotenv').config({ path: '.env' });
const sql = require('mssql');
const tables = {
  CashInOutEntry: ['Counter_Name','Cashier_Name','cmy_name','daily_cashier_bill','date','Cash_Out_Amout','Cash_In_Amount'],
  openpattycash: ['counter_name','cashier_name','tot_amm','date','status'],
  closepattycash: ['counter_name','cashier_name','date','totalbillno','netamount','cashinamt','cashoutamt','openingamt','cashdrawamt','cardamt','creditamt','googlepay'],
  BankTransEntry: ['TansactionCode','TranOutAmount','TranInAmount','TranBalanceAmount','TranEntryDate','AccountName','BankName','Mode'],
};
(async () => {
  const p = await sql.connect({ server: process.env.TEXTILESOFT_DB_HOST, port: +process.env.TEXTILESOFT_DB_PORT,
    database: process.env.TEXTILESOFT_DB_NAME, user: process.env.TEXTILESOFT_DB_USER, password: process.env.TEXTILESOFT_DB_PASSWORD,
    options: { encrypt: process.env.TEXTILESOFT_DB_ENCRYPT === 'true', trustServerCertificate: true } });
  for (const [t, cols] of Object.entries(tables)) {
    console.log('\n== ' + t);
    const c = await p.request().query(`select COLUMN_NAME n, DATA_TYPE d from INFORMATION_SCHEMA.COLUMNS where TABLE_NAME='${t}'`);
    if (!c.recordset.length) { console.log('  TABLE MISSING'); continue; }
    const have = Object.fromEntries(c.recordset.map(r => [r.n.toLowerCase(), r.d]));
    for (const col of cols) console.log('  ' + col.padEnd(22) + (have[col.toLowerCase()] || 'MISSING'));
    const n = await p.request().query(`select count(*) c from [${t}]`);
    console.log('  rows:', n.recordset[0].c);
    const s = await p.request().query(`select top 3 * from [${t}] order by 1 desc`);
    console.log(s.recordset);
  }
  console.log('\n== sales2 daily takings (latest 5 days)');
  const t = await p.request().query(`select top 5 convert(varchar(10),[date],23) d, count(*) bills, sum(try_cast(tot_netamnt as float)) total, sum(try_cast(s_recevied_cashamt as float)) cash, sum(try_cast(s_card_amt as float)) card, sum(try_cast(s_googlepay as float)) upi, sum(try_cast(s_credit_amt as float)) credit from sales2 where isnull(status,'')<>'1' group by convert(varchar(10),[date],23) order by d desc`);
  console.log(t.recordset);
  process.exit(0);
})().catch(e => { console.log('ERR', e.message); process.exit(1); });
