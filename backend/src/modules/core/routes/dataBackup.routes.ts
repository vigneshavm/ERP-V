import { Router } from 'express';
import { randomUUID } from 'node:crypto';
import path from 'node:path';
import { protect, authorize } from '../../../middlewares/authMiddleware.js';
import { sqlRoute } from '../../../integrations/textilesoft/sqlRoute.js';
import { sqlWriter, SqlWriteError } from '../../../integrations/textilesoft/sqlWrite.js';
const router=Router();
router.post('/',protect,authorize('owner','co-owner'),sqlRoute(async (req,res)=>{
  if(Object.keys(req.body??{}).length) throw new SqlWriteError('The backup target is server configured; request paths are not accepted.',400);
  const directory=process.env.TEXTILESOFT_BACKUP_DIR;
  if(!directory||!path.win32.isAbsolute(directory)||[...directory].some(character=>character.charCodeAt(0)<32)) throw new SqlWriteError('Configure an existing absolute SQL Server backup directory.',503,'SQL_BACKUP_UNAVAILABLE');
  const {pool,database}=await sqlWriter();
  const permission=await pool.request().query("SELECT DB_NAME() AS name, HAS_PERMS_BY_NAME(DB_NAME(),'DATABASE','BACKUP DATABASE') AS allowed");
  if(permission.recordset?.[0]?.name!==database||permission.recordset?.[0]?.allowed!==1) throw new SqlWriteError('The configured writer has no verified backup permission. No grants were changed.',503,'SQL_BACKUP_UNAVAILABLE');
  req.setTimeout(330000);res.setTimeout(330000);
  const file=path.win32.join(directory,`erp-copy-${new Date().toISOString().replace(/[:.]/g,'-')}-${randomUUID()}.bak`);
  const request=pool.request();request.timeout=300000;request.input('file',file);
  // Existing database only, fresh filename; COPY_ONLY does not replace the normal backup chain.
  const name='['+String(database).replaceAll(']',']]')+']';
  await request.query(`BACKUP DATABASE ${name} TO DISK=@file WITH COPY_ONLY, CHECKSUM, NOINIT`);
  res.json({success:true,data:{file,database,copyOnly:true}});
}));
export default router;
