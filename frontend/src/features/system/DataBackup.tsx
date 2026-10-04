import { useState } from 'react';
import api from '../../services/api';
import { isAxiosError } from 'axios';
export default function DataBackup() {
  const [message,setMessage]=useState(''), [busy,setBusy]=useState(false);
  async function backup() {
    setBusy(true);setMessage('');
    try {
      const response=await api.post('/api/system/data-backup',{});
      if(response.data?.success!==true||typeof response.data?.data?.file!=='string') throw Error('Backup completion was not confirmed.');
      setMessage(`SQL Server confirmed COPY_ONLY backup: ${response.data.data.file}. A backup is not a restore test.`);
    } catch(error:unknown) { setMessage(isAxiosError(error)?error.response?.data?.error?.message||error.response?.data?.message||error.message:error instanceof Error?error.message:'Backup unavailable.'); }
    finally {setBusy(false);}
  }
  return <main className="p-6 space-y-5 text-main"><h1 className="text-2xl font-bold">System → Data Backup</h1>
    <p>Create a COPY_ONLY backup of the configured existing shop database, using the existing writer login's backup permission. SQL Server writes the file in the configured TEXTILESOFT_BACKUP_DIR. No restore, permission repair or schema change runs.</p>
    <p>The configured directory must already exist on the SQL Server host. Missing configuration or permission returns unavailable. Owner / co-owner access is required.</p>
    <button disabled={busy} onClick={()=>void backup()} className="rounded border px-3 py-2">{busy?'Backing up…':'Create database backup'}</button>
    {message&&<p role="status">{message}</p>}
  </main>;
}
