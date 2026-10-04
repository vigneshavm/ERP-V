import { useCallback, useEffect, useMemo, useState } from "react";
import { isAxiosError } from "axios";
import { Pencil, Plus, Search, Trash2 } from "lucide-react";
import api from "../../services/api";
import Layout from "../../components/shared/Layout/index";

/** Product categories = Textilesoft's product groups (progroup) and sub groups (prosubgroup). */
interface Entry { _id: string; name: string; parentId?: string; description?: string }
type Kind = "PRODUCT_GROUP" | "PRODUCT_SUBGROUP";

const errText = (e: unknown): string =>
  isAxiosError(e) ? e.response?.data?.message || e.response?.data?.error?.message || e.message : e instanceof Error ? e.message : "Something went wrong.";
const asList = (d: unknown): Entry[] => (Array.isArray(d) ? d : Array.isArray((d as any)?.data) ? (d as any).data : []);

const CategoriesSql = () => {
  const [kind, setKind] = useState<Kind>("PRODUCT_GROUP");
  const [groups, setGroups] = useState<Entry[]>([]);
  const [subs, setSubs] = useState<Entry[]>([]);
  const [search, setSearch] = useState("");
  const [name, setName] = useState("");
  const [parentId, setParentId] = useState("");
  const [editing, setEditing] = useState<Entry | null>(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    setBusy(true); setError("");
    try {
      const [g, s] = await Promise.all([api.get("/api/masters/PRODUCT_GROUP"), api.get("/api/masters/PRODUCT_SUBGROUP")]);
      setGroups(asList(g.data)); setSubs(asList(s.data));
    } catch (e) { setError(errText(e)); } finally { setBusy(false); }
  }, []);
  useEffect(() => { void load(); }, [load]);

  const groupName = useMemo(() => new Map(groups.map(g => [g._id, g.name])), [groups]);
  const list = (kind === "PRODUCT_GROUP" ? groups : subs).filter(e => e.name.toLowerCase().includes(search.trim().toLowerCase()));
  const counts = useMemo(() => {
    const m = new Map<string, number>();
    for (const s of subs) if (s.parentId) m.set(s.parentId, (m.get(s.parentId) ?? 0) + 1);
    return m;
  }, [subs]);

  const reset = () => { setEditing(null); setName(""); setParentId(""); };
  const startEdit = (e: Entry) => { setEditing(e); setName(e.name); setParentId(e.parentId ?? ""); };

  async function save(ev: React.FormEvent) {
    ev.preventDefault();
    const n = name.trim();
    if (!n) return;
    if (kind === "PRODUCT_SUBGROUP" && !parentId) { setError("Choose the group this sub group belongs to."); return; }
    setBusy(true); setError("");
    try {
      const body = { name: n, ...(kind === "PRODUCT_SUBGROUP" ? { parentId } : {}) };
      if (editing) await api.put(`/api/masters/entry/${encodeURIComponent(editing._id)}`, body);
      else await api.post(`/api/masters/${kind}`, body);
      reset(); await load();
    } catch (e) { setError(errText(e)); setBusy(false); }
  }
  async function remove(e: Entry) {
    if (!window.confirm(`Delete "${e.name}"? This cannot be undone.`)) return;
    setBusy(true); setError("");
    try { await api.delete(`/api/masters/entry/${encodeURIComponent(e._id)}`); if (editing?._id === e._id) reset(); await load(); }
    catch (err) { setError(errText(err)); setBusy(false); }
  }

  const field = "h-11 rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-700 outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200";
  const cap = "mb-2 block text-[10px] font-black uppercase tracking-widest text-slate-400";
  const th = "whitespace-nowrap border-b border-slate-200 px-5 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400 dark:border-slate-700";

  return (
    <Layout>
      <div className="space-y-5 py-4">
        <div className="rounded-2xl border border-slate-200 bg-white p-6 dark:border-slate-700 dark:bg-slate-800">
          <h1 className="text-lg font-bold text-slate-900 dark:text-white">Categories</h1>
          <p className="mb-5 mt-1 text-xs text-slate-400">Product groups and sub groups, stored in your Textilesoft database.</p>
          <div className="mb-5 inline-flex rounded-lg border border-slate-200 bg-slate-50 p-1 dark:border-slate-700 dark:bg-slate-900/50">
            {([["PRODUCT_GROUP", "Groups"], ["PRODUCT_SUBGROUP", "Sub groups"]] as const).map(([k, l]) => (
              <button key={k} type="button" onClick={() => { setKind(k); reset(); setSearch(""); }}
                className={`rounded-md px-4 py-1.5 text-xs font-bold ${kind === k ? "bg-white text-slate-900 shadow-sm dark:bg-slate-700 dark:text-white" : "text-primary"}`}>{l}</button>
            ))}
          </div>
          <form onSubmit={save} className="grid grid-cols-1 items-end gap-4 md:grid-cols-2 xl:grid-cols-[1.4fr_1fr_auto_auto]">
            <label className="block"><span className={cap}>{kind === "PRODUCT_GROUP" ? "Group name" : "Sub group name"}</span>
              <input className={`${field} w-full`} value={name} onChange={e => setName(e.target.value)} maxLength={100} /></label>
            {kind === "PRODUCT_SUBGROUP" && (
              <label className="block"><span className={cap}>Group</span>
                <select className={`${field} w-full`} value={parentId} onChange={e => setParentId(e.target.value)}>
                  <option value="">Select group…</option>
                  {groups.map(g => <option key={g._id} value={g._id}>{g.name}</option>)}
                </select></label>
            )}
            <button type="submit" disabled={busy || !name.trim()} className="flex h-11 items-center justify-center gap-2 rounded-lg bg-primary px-5 text-sm font-bold text-white disabled:opacity-60">
              <Plus size={16} />{editing ? "Save changes" : "Add"}</button>
            {editing && <button type="button" onClick={reset} className="h-11 rounded-lg border border-slate-200 px-5 text-sm font-bold text-slate-600 dark:border-slate-700 dark:text-slate-300">Cancel</button>}
          </form>
        </div>

        {error && <p role="alert" className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700 dark:border-red-900 dark:bg-red-950/40 dark:text-red-300">{error}</p>}

        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-800">
          <div className="border-b border-slate-100 p-4 dark:border-slate-700">
            <span className="relative block max-w-sm">
              <Search size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input className={`${field} w-full pl-9`} placeholder="Search…" value={search} onChange={e => setSearch(e.target.value)} />
            </span>
          </div>
          <table className="w-full table-fixed border-collapse text-left">
            <thead className="bg-slate-50 dark:bg-slate-900/50">
              <tr>
                <th className={`${th} w-[10%] text-left`}>#</th>
                <th className={`${th} text-left`}>Name</th>
                <th className={`${th} w-[25%] text-left`}>{kind === "PRODUCT_GROUP" ? "Sub groups" : "Group"}</th>
                <th className={`${th} w-[18%] text-right`}>Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
              {list.map((e, i) => (
                <tr key={e._id} className="hover:bg-slate-50/70 dark:hover:bg-slate-900/30">
                  <td className="px-5 py-4 text-xs font-bold text-slate-400">{i + 1}</td>
                  <td className="px-5 py-4 text-xs font-bold text-slate-800 dark:text-slate-100">{e.name}</td>
                  <td className="px-5 py-4 text-xs text-slate-600 dark:text-slate-300">
                    {kind === "PRODUCT_GROUP" ? (counts.get(e._id) ?? 0) : (e.parentId ? groupName.get(e.parentId) ?? "—" : "—")}
                  </td>
                  <td className="px-5 py-4 text-right">
                    <button type="button" aria-label={`Edit ${e.name}`} onClick={() => startEdit(e)} className="mr-2 rounded-lg border border-slate-200 p-2 text-slate-500 hover:bg-slate-50 dark:border-slate-700"><Pencil size={14} /></button>
                    <button type="button" aria-label={`Delete ${e.name}`} onClick={() => void remove(e)} className="rounded-lg border border-slate-200 p-2 text-red-500 hover:bg-red-50 dark:border-slate-700"><Trash2 size={14} /></button>
                  </td>
                </tr>
              ))}
              {!list.length && <tr><td colSpan={4} className="px-5 py-16 text-center text-xs font-bold text-slate-400">{busy ? "Loading…" : "Nothing here yet."}</td></tr>}
            </tbody>
          </table>
        </div>
      </div>
    </Layout>
  );
};

export default CategoriesSql;
