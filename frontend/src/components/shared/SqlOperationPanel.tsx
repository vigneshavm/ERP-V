import React, { useState, useEffect } from 'react';
import { isAxiosError } from 'axios';
import api from '../../services/api';
import { PRINTER_PROFILES, generateBatchCommands, printFileExtension } from '../../utils/labelPrinterFormats';

export type Operation = 'agent' | 'customer' | 'mobile' | 'card' | 'name' | 'rc-grn' | 'ref-grn' | 'missing-sales' | 'salesmen' | 'customer-lookup' | 'barcode-cancel';
type NativeRow = Record<string, unknown>;
const operationDefinitions: { id: Operation; label: string }[] = [
  { id: 'barcode-cancel', label: 'Barcode cancel' },
  { id: 'agent', label: 'Register agent' },
  { id: 'customer', label: 'Different customer entry without points' },
  { id: 'mobile', label: 'Mobile number change' },
  { id: 'card', label: 'Card number change' },
  { id: 'name', label: 'Customer name change' },
  { id: 'rc-grn', label: 'RC GRN details' },
  { id: 'ref-grn', label: 'Reference GRN details' },
  { id: 'missing-sales', label: 'Missing Sales (ESC / Delete)' },
  { id: 'salesmen', label: 'Salesman stickers' },
  { id: 'customer-lookup', label: 'Customer points and credit balance lookup' },
];

const partyFields = [
  ['name', 'Name'], ['cardNumber', 'Card number'], ['mobile', 'Mobile'], ['phone', 'Phone'], ['email', 'Email'],
  ['city', 'City'], ['pincode', 'PIN code'], ['discountPercent', 'Bill discount %'], ['birthday', 'Birthday'], ['weddingDate', 'Wedding date'],
  ['address1', 'Address 1'], ['address2', 'Address 2'], ['address3', 'Address 3'], ['address4', 'Address 4'], ['address5', 'Address 5'],
];
const errorText = (error: unknown) => isAxiosError<{ message?: string; error?: { message?: string } }>(error)
  ? error.response?.data?.error?.message || error.response?.data?.message || error.message
  : error instanceof Error ? error.message : 'Operation failed.';

interface SqlOperationPanelProps {
  title: string;
  allowedOperations: readonly [Operation, ...Operation[]];
  onSaved?: () => void;
}

export default function SqlOperationPanel({ title, allowedOperations, onSaved }: SqlOperationPanelProps) {
  const [operation, setOperation] = useState<Operation>(allowedOperations[0]);
  const [rows, setRows] = useState<NativeRow[]>([]);
  const [busy, setBusy] = useState(false);
  const [paging, setPaging] = useState<{ page: number; limit: number; total: number; pages: number } | null>(null);
  const [pageLimit, setPageLimit] = useState(100);
  const [lastForm, setLastForm] = useState<Record<string, string>>({});
  const [message, setMessage] = useState('');
  const [failed, setFailed] = useState(false);
  const [selectedCode, setSelectedCode] = useState('');
  const [copies, setCopies] = useState(1);
  const [widthMm, setWidthMm] = useState(50);
  const [heightMm, setHeightMm] = useState(25);
  const [printer, setPrinter] = useState<'TSC' | 'ZEBRA'>('TSC');
  const [capabilities, setCapabilities] = useState<{ customerRegister: boolean; agentRegister: boolean; customerChange: boolean } | null>(null);
  const [capabilityError, setCapabilityError] = useState('');
  const needsWriteCapabilities = allowedOperations.some(id => ['agent', 'customer', 'mobile', 'card', 'name'].includes(id));
  const choices = operationDefinitions.filter(item => allowedOperations.includes(item.id));
  useEffect(() => {
    if (!needsWriteCapabilities) return;
    let mounted = true;
    api.get('/api/reports/legacy/capabilities').then(response => {
      const result = response.data?.data;
      if (response.data?.success === false || !result || ['customerRegister', 'agentRegister', 'customerChange'].some(key => typeof result[key] !== 'boolean')) throw new Error('SQL writer capabilities could not be verified.');
      if (mounted) setCapabilities(result);
    }).catch(error => { if (mounted) setCapabilityError(errorText(error)); });
    return () => { mounted = false; };
  }, [needsWriteCapabilities]);
  const creating = operation === 'agent' || operation === 'customer';
  const changing = operation === 'mobile' || operation === 'card' || operation === 'name';
  const writable = operation === 'agent' ? capabilities?.agentRegister : operation === 'customer' ? capabilities?.customerRegister : changing ? capabilities?.customerChange : true;
  const fields = creating ? [...partyFields, ...(operation === 'customer' ? [['address', 'Address'], ['creditDays', 'Credit days'], ['religion', 'Religion']] : [])]
    : changing ? [['id', 'Existing customer card / serial'], ['value', 'New value']]
    : operation === 'missing-sales' ? [['from', 'From date'], ['to', 'To date'], ['counter', 'Counter (optional)'], ['login', 'Login (optional)']]
    : operation === 'salesmen' ? [] : operation === 'customer-lookup' ? [['search', 'Name, mobile or card']]
    : [['id', operation === 'rc-grn' ? 'RC GRN' : operation === 'barcode-cancel' ? 'Barcode' : 'Reference GRN']];
  const columns = [...new Set(rows.flatMap(row => Object.keys(row)))];

  const submit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const data = Object.fromEntries(new FormData(event.currentTarget).entries()) as Record<string, string>;
    setBusy(true); setMessage(''); setFailed(false); setRows([]); setSelectedCode(''); setPaging(null);
    if (operation === 'missing-sales') setLastForm(data);
    try {
      if ((creating || changing) && !writable) throw new Error("This operation is unavailable: the configured SQL writer lacks verified native-table write permission. No permission repair is performed.");
      if (!allowedOperations.includes(operation)) throw new Error("This action does not belong to this screen.");
      let response;
      if (creating) response = await api.post(operation === 'agent' ? '/api/agents' : '/api/customers', data);
      else if (changing) response = await api.put(`/api/customers/${encodeURIComponent(data.id)}/${operation}`, { value: data.value });
      else if (operation === 'barcode-cancel') {
        if (!window.confirm(`Cancel barcode ${data.id}? Billing will refuse it afterwards. Stock rows and GRN totals are not changed.`)) return;
        response = await api.post(`/api/inventory/barcode/${encodeURIComponent(data.id)}/cancel`);
      }
      else if (operation === 'customer-lookup') response = await api.get('/api/customers', { params: { search: data.search } });
      else if (operation === 'salesmen') response = await api.get('/api/reports/legacy/salesmen');
      else if (operation === 'missing-sales') { response = await api.get('/api/reports/legacy/missing-sales', { params: { ...data, page: 1, limit: pageLimit } }); setPaging(response.data?.pagination ?? null); }
      else response = await api.get(`/api/reports/legacy/${operation}/${encodeURIComponent(data.id)}`);
      if (response.data?.success === false) throw new Error(response.data?.message || "The SQL operation was refused.");
      if (operation === "barcode-cancel") {
        const done = response.data?.data as { barcode?: string; cancelledLines?: number } | undefined;
        if (!done || typeof done.cancelledLines !== 'number' || done.cancelledLines < 1) throw new Error('The server did not confirm the cancellation.');
        setRows([done as NativeRow]);
        setMessage(`Barcode ${done.barcode} cancelled: ${done.cancelledLines} purchase line(s) flagged. Stock rows and GRN totals are unchanged.`);
        return;
      }
      const result: unknown = response.data?.data;
      const records = Array.isArray(result) ? result : [result];
      if (records.some(row => !row || typeof row !== 'object' || Array.isArray(row))) throw new Error('The server returned no valid SQL result.');
      if ((creating || changing) && (records.length !== 1 || !(records[0] as NativeRow)._id)) throw new Error('The server did not confirm a saved native identity.');
      setRows(records as NativeRow[]);
      setMessage(creating || changing ? 'Saved in existing SQL records.' : operation === 'missing-sales' && response.data?.pagination ? `${records.length} of ${response.data.pagination.total} SQL records loaded (page ${response.data.pagination.page} of ${response.data.pagination.pages}).` : `${records.length} SQL records loaded.`);
      if (creating || changing) onSaved?.();
    } catch (error) { setFailed(true); setMessage(errorText(error)); }
    finally { setBusy(false); }
  };

  const goPage = async (page: number, limit = pageLimit) => {
    setBusy(true); setMessage(''); setFailed(false);
    try {
      const response = await api.get('/api/reports/legacy/missing-sales', { params: { ...lastForm, page, limit } });
      if (response.data?.success === false) throw new Error(response.data?.message || 'The SQL operation was refused.');
      const result = response.data?.data;
      if (!Array.isArray(result)) throw new Error('The server returned no valid SQL result.');
      setRows(result as NativeRow[]); setPaging(response.data?.pagination ?? null);
      const pg = response.data?.pagination;
      setMessage(pg ? `${result.length} of ${pg.total} SQL records loaded (page ${pg.page} of ${pg.pages}).` : `${result.length} SQL records loaded.`);
    } catch (error) { setFailed(true); setMessage(errorText(error)); }
    finally { setBusy(false); }
  };

  const downloadStickers = () => {
    try {
      const matches = rows.filter(row => String(row.code) === selectedCode);
      if (matches.length !== 1) throw new Error('Select one uniquely identified salesman.');
      const name = String(matches[0].name_eng ?? '');
      if (!/^[A-Za-z0-9_-]{1,50}$/.test(selectedCode) || !name || Array.from(name).some(char => char.charCodeAt(0) < 32 || char.charCodeAt(0) === 127)) throw new Error('This native code/name cannot be safely sent to the selected label printer.');
      if (!Number.isSafeInteger(copies) || copies < 1 || copies > 500) throw new Error('Sticker quantity must be an integer between 1 and 500.');
      if (![widthMm, heightMm].every(value => Number.isFinite(value) && value >= 10 && value <= 200)) throw new Error("Label dimensions must be between 10 and 200 mm.");
      const profile = PRINTER_PROFILES[printer];
      const commands = generateBatchCommands(profile, [{ code: selectedCode, name }], { widthMm, heightMm }, copies);
      const url = URL.createObjectURL(new Blob([commands], { type: 'text/plain' }));
      const link = document.createElement('a'); link.href = url; link.download = `salesman-${selectedCode}.${printFileExtension(profile)}`; link.click(); URL.revokeObjectURL(url);
      setFailed(false); setMessage('Sticker file generated with the native employee code. Physical print and scan acceptance are pending.');
    } catch (error) { setFailed(true); setMessage(errorText(error)); }
  };

  return <section className="space-y-5 text-main" aria-label={title}>
    <h2 className="text-xl font-bold">{title}</h2>
    {choices.length > 1 && <label className="block">Action <select value={operation} className="ml-3 border rounded p-2 bg-surface" disabled={busy} onChange={event => { setOperation(event.target.value as Operation); setRows([]); setMessage(''); setSelectedCode(''); }}>
      {choices.map(item => <option key={item.id} value={item.id}>{item.label}</option>)}
    </select></label>}
    {changing && <p>Changes preserve the customer serial, points and balances, and update matching historical bill contact fields. Ambiguous or duplicate identities are refused.</p>}
    {operation === 'customer' && <p>This is the legacy Different Customer Entry without points. It stores native contact, religion and credit-day fields; it does not award points.</p>}
    {operation === 'agent' && <p>Bill discount belongs to the agent master. Purchase commission is a separate purchase field. Supplier-linked editing remains unavailable until its native identity checks are verified.</p>}
    {operation === 'barcode-cancel' && <p>Cancelling flags the barcode's purchase line so billing refuses it, as the legacy screen does. Any saved sale blocks cancellation. Stock rows and GRN quantity/net totals are not changed, and the legacy GST re-total is not reproduced.</p>}
    {operation === 'missing-sales' && <p>This report lists saved ESC/deleted lines. Bill-level values may repeat across lines and must not be summed as bill totals.</p>}
    {operation === 'customer-lookup' && <p>Points and credit balance are read from the native customer master. This lookup does not associate a customer with anonymous SQL checkout.</p>}
    {(creating || changing) && !writable && <p role="status">{capabilityError || (capabilities ? 'Unavailable: the configured writer does not have the required native-table write permission. No permissions will be changed.' : 'Checking native SQL write permissions…')}</p>}
    <form key={operation} onSubmit={submit} className="space-y-3">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">{fields.map(([key, label]) => <label key={key} className="block">{label}
        <input name={key} disabled={busy} required={creating ? ['name', 'cardNumber', 'mobile'].includes(key) : changing || ['id', 'from', 'to'].includes(key)}
          type={['from', 'to', 'birthday', 'weddingDate'].includes(key) ? 'date' : ['discountPercent', 'creditDays'].includes(key) ? 'number' : 'text'}
          step={key === 'discountPercent' ? '0.01' : undefined} min={['discountPercent', 'creditDays'].includes(key) ? 0 : undefined} max={key === 'discountPercent' ? 100 : undefined}
          className="block w-full mt-1 rounded border p-2 bg-surface" />
      </label>)}</div>
      {operation === 'missing-sales' && <label className="block">Status <select name="status" className="ml-3 border p-2 bg-surface"><option value="">All</option><option value="1">ESC</option><option value="0">Delete</option></select></label>}
      <button disabled={busy || ((creating || changing) && !writable)} className="rounded bg-primary px-4 py-2 text-white disabled:opacity-50">{busy ? 'Working…' : creating ? 'Register' : changing ? 'Save identity change' : operation === 'barcode-cancel' ? 'Check cancellation' : 'Load SQL records'}</button>
    </form>
    {message && <p role={failed ? 'alert' : 'status'}>{message}</p>}
    {operation === 'missing-sales' && <div className="flex flex-wrap items-center gap-3">
      <label>Rows per page <select value={pageLimit} disabled={busy} onChange={event => { const v = Number(event.target.value); setPageLimit(v); if (paging) void goPage(1, v); }} className="ml-2 border p-2 bg-surface">{[50, 100, 250, 500].map(n => <option key={n} value={n}>{n}</option>)}</select></label>
      {paging && <>
        <button type="button" className="border rounded px-3 py-2 disabled:opacity-50" disabled={busy || paging.page <= 1} onClick={() => void goPage(paging.page - 1)}>Previous</button>
        <span>Page {paging.page} of {paging.pages}</span>
        <button type="button" className="border rounded px-3 py-2 disabled:opacity-50" disabled={busy || paging.page >= paging.pages} onClick={() => void goPage(paging.page + 1)}>Next</button>
      </>}
    </div>}
    {operation === 'salesmen' && rows.length > 0 && <div className="flex flex-wrap gap-3 items-center">
      <label>Salesman <select value={selectedCode} onChange={event => setSelectedCode(event.target.value)} className="ml-2 border p-2 bg-surface"><option value="">Select</option>{rows.map((row, index) => <option key={index} value={String(row.code)}>{String(row.code)} — {String(row.name_eng)}</option>)}</select></label>
      <label>Copies <input type="number" min="1" max="500" value={copies} onChange={event => setCopies(Number(event.target.value))} className="ml-2 w-20 border p-2 bg-surface" /></label>
      <label>Width mm <input type="number" min="10" max="200" value={widthMm} onChange={event => setWidthMm(Number(event.target.value))} className="ml-2 w-20 border p-2 bg-surface" /></label>
      <label>Height mm <input type="number" min="10" max="200" value={heightMm} onChange={event => setHeightMm(Number(event.target.value))} className="ml-2 w-20 border p-2 bg-surface" /></label>
      <label>Printer <select value={printer} onChange={event => setPrinter(event.target.value as 'TSC' | 'ZEBRA')} className="ml-2 border p-2 bg-surface"><option value="TSC">TSC / TSPL</option><option value="ZEBRA">Zebra / ZPL</option></select></label>
      <button className="border rounded p-2" onClick={downloadStickers}>Generate sticker file</button>
    </div>}
    {rows.length > 0 && <div className="overflow-auto"><table className="w-full text-left text-sm"><thead><tr>{columns.map(column => <th className="p-2" key={column}>{column}</th>)}</tr></thead><tbody>{rows.map((row, index) => <tr key={index}>{columns.map(column => <td className="p-2 border-t align-top" key={column}>{String(row[column] ?? '')}</td>)}</tr>)}</tbody></table></div>}
  </section>;
}
