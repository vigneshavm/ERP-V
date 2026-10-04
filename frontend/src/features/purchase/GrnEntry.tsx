import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Plus, Trash2, Loader2, Save, Eye, X, RotateCcw } from "lucide-react";
import api from "../../services/api";
import PageHeader from "../../components/shared/Layout/PageHeader";
import { Button } from "@/components/shared/Button";
import { Input } from "@/components/shared/Input";
import { GRN_ATTRIBUTES, useAttributeSuggestions } from "./useAttributeSuggestions";

/**
 * Purchase / GRN entry saved straight into Textilesoft (purgrnentry + purentrydetails + stockdetails) via
 * /api/purchase-entry. GRN number and barcodes are allocated by the server in Textilesoft's own format.
 * Line maths mirror Textilesoft (amount = rate x qty [x metres], less and discount before GST).
 */
interface Opts {
  companies: { name: string; grnPrefix: string }[];
  warehouses: string[];
  suppliers: { name: string; city: string }[];
  agents: string[];
  products: {
    code: string;
    name: string;
    unit: string;
    group: string;
    gstGroup: string;
    hsnCode: string;
    company: string;
  }[];
  gstGroups: {
    name: string;
    slabs: { from: number; to: number; gst: number }[];
  }[];
}

interface Line {
  key: number;
  productCode: string;
  qty: string;
  mtr: string;
  prate: string;
  discountPercent: string;
  gstPercent: string;
  mrp: string;
  size: string;
  brand: string;
  pattern: string;
  color: string;
  design: string;
  rack: string;
}

interface Saved {
  grnNo: string;
  date: string;
  lines: {
    slNo: number;
    barcode: string;
    productName: string;
    qty: number;
    mrp: number;
  }[];
  totals: { qty: number; amount: number; gst: number; net: number };
}

interface ListRow {
  grnNo: string;
  company: string;
  supplier: string;
  invoiceNo: string;
  date: string;
  qty: number;
  taxable: number;
  gst: number;
  total: number;
}

let keySeq = 1;
const newLine = (): Line => ({
  key: keySeq++,
  productCode: "",
  qty: "",
  mtr: "",
  prate: "",
  discountPercent: "",
  gstPercent: "",
  mrp: "",
  size: "",
  brand: "",
  pattern: "",
  color: "",
  design: "",
  rack: "",
});
const n = (v: string) => (v.trim() === "" ? 0 : Number(v));
const r2 = (x: number) => Math.round((x + Number.EPSILON) * 100) / 100;
const money = (x: number) =>
  x.toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
const today = () => new Date().toISOString().slice(0, 10);
const errorText = (err: unknown, fallback: string) =>
  (err as { response?: { data?: { message?: string } } })?.response?.data
    ?.message || fallback;

const cell =
  "w-full px-2 py-1.5 text-sm bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded";
const field =
  "w-full mt-1 px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm";
const label = "text-[10px] font-bold uppercase tracking-wider text-slate-500";

const GrnEntry: React.FC = () => {
  const [tab, setTab] = useState<"entry" | "list">("entry");
  const [opts, setOpts] = useState<Opts | null>(null);
  const [loadError, setLoadError] = useState("");

  const [company, setCompany] = useState("");
  const [warehouse, setWarehouse] = useState("");
  const [supplier, setSupplier] = useState("");
  const [agent, setAgent] = useState("");
  const [invoiceNo, setInvoiceNo] = useState("");
  const [invoiceDate, setInvoiceDate] = useState(today());
  const [date, setDate] = useState(today());
  const [lines, setLines] = useState<Line[]>([newLine()]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  // Server said this supplier invoice is already entered: shown with a "Save anyway" button.
  const [duplicateInvoice, setDuplicateInvoice] = useState("");
  const [saved, setSaved] = useState<Saved | null>(null);

  const [list, setList] = useState<ListRow[]>([]);
  const [listLoading, setListLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [viewing, setViewing] = useState<any | null>(null);
  const [listError, setListError] = useState("");

  useEffect(() => {
    api
      .get("/api/purchase-entry/options")
      .then((res) => {
        const o: Opts = res.data?.data;
        setOpts(o);
        setCompany((c) => c || o.companies[0]?.name || "");
        setWarehouse((w) => w || o.warehouses[0] || "");
      })
      .catch((err) =>
        setLoadError(
          errorText(
            err,
            "Could not load the purchase lists from the shop database.",
          ),
        ),
      );
  }, []);

  // Only a supplier from the list scopes the suggestions (not every keystroke while typing).
  const knownSupplier = useMemo(
    () => (opts?.suppliers.some((s) => s.name === supplier) ? supplier : ""),
    [opts, supplier],
  );
  const suggestions = useAttributeSuggestions(knownSupplier);

  const products = useMemo(
    () => (opts?.products ?? []).filter((p) => p.company === company),
    [opts, company],
  );
  const productByCode = useMemo(
    () => new Map(products.map((p) => [p.code, p])),
    [products],
  );

  /** Default GST% from the product's GST group slab for the per-unit rate (like Textilesoft). */
  const gstFor = useCallback(
    (code: string, rate: number): number => {
      const p = productByCode.get(code);
      const g = opts?.gstGroups.find(
        (x) => x.name.toUpperCase() === (p?.gstGroup ?? "").toUpperCase(),
      );
      if (!g) return 0;
      const slab =
        g.slabs.find((s) => rate >= s.from && rate <= (s.to || Infinity)) ??
        g.slabs[0];
      return slab?.gst ?? 0;
    },
    [productByCode, opts],
  );

  const calc = (l: Line) => {
    const qty = n(l.qty),
      mtr = n(l.mtr),
      prate = n(l.prate);
    const units = mtr > 0 ? qty * mtr : qty;
    const amount = r2(prate * units);
    const dis = r2((amount * n(l.discountPercent)) / 100);
    const gstPct =
      l.gstPercent.trim() !== ""
        ? n(l.gstPercent)
        : gstFor(l.productCode, prate);
    const gst = r2(((amount - dis) * gstPct) / 100);
    return { amount, dis, gstPct, gst, net: r2(amount - dis + gst) };
  };

  const totals = lines.reduce(
    (t, l) => {
      if (!l.productCode) return t;
      const c = calc(l);
      return {
        qty: t.qty + n(l.qty),
        taxable: t.taxable + c.amount - c.dis,
        gst: t.gst + c.gst,
        net: t.net + c.net,
      };
    },
    { qty: 0, taxable: 0, gst: 0, net: 0 },
  );

  const setLine = (key: number, patch: Partial<Line>) =>
    setLines((ls) => ls.map((l) => (l.key === key ? { ...l, ...patch } : l)));

  const reset = () => {
    setLines([newLine()]);
    setInvoiceNo("");
    setError("");
    setDuplicateInvoice("");
  };

  const save = async (allowDuplicateInvoice = false) => {
    setError("");
    setDuplicateInvoice("");
    setSaved(null);
    const filled = lines.filter((l) => l.productCode);
    if (!invoiceNo.trim()) return setError("Please Enter Invoice No..");
    if (!filled.length)
      return setError("Empty Purchase not allowed. Please Enter Data...");
    setSaving(true);
    try {
      const res = await api.post("/api/purchase-entry", {
        company,
        warehouse,
        supplier,
        agent: agent || undefined,
        invoiceNo: invoiceNo.trim(),
        invoiceDate,
        date,
        ...(allowDuplicateInvoice ? { allowDuplicateInvoice: true } : {}),
        lines: filled.map((l) => ({
          productCode: l.productCode,
          qty: n(l.qty),
          mtr: n(l.mtr) || undefined,
          prate: n(l.prate),
          mrp: n(l.mrp),
          discountPercent: n(l.discountPercent) || undefined,
          gstPercent: l.gstPercent.trim() !== "" ? n(l.gstPercent) : undefined,
          size: l.size,
          brand: l.brand,
          pattern: l.pattern,
          color: l.color,
          design: l.design,
          rack: l.rack,
        })),
      });
      setSaved(res.data?.data);
      reset();
    } catch (err) {
      const code = (err as { response?: { data?: { code?: string } } })
        ?.response?.data?.code;
      if (code === "DUPLICATE_INVOICE")
        setDuplicateInvoice(errorText(err, "This invoice is already entered."));
      else setError(errorText(err, "Could not save the purchase."));
    } finally {
      setSaving(false);
    }
  };

  const loadList = useCallback(async () => {
    setListLoading(true);
    setListError("");
    try {
      const res = await api.get("/api/purchase-entry", {
        params: { q: search || undefined, limit: 100 },
      });
      setList(res.data?.data ?? []);
    } catch (err) {
      setListError(errorText(err, "Could not load purchases."));
    } finally {
      setListLoading(false);
    }
  }, [search]);

  useEffect(() => {
    if (tab === "list") loadList();
  }, [tab, loadList]);

  const view = async (grnNo: string) => {
    setListError("");
    try {
      const res = await api.get(
        `/api/purchase-entry/${encodeURIComponent(grnNo)}`,
      );
      setViewing(res.data?.data);
    } catch (err) {
      setListError(errorText(err, "Could not open the purchase."));
    }
  };

  const prefix = opts?.companies.find((c) => c.name === company)?.grnPrefix;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Purchase Entry"
        description="GRNs saved straight into Textilesoft — same GRN numbers, barcodes and stock as its own purchase screen."
      />

      <div className="flex gap-2">
        {(["entry", "list"] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-4 py-2 rounded-lg text-sm font-bold ${tab === t ? "bg-primary text-white" : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300"}`}
          >
            {t === "entry" ? "New purchase" : "Purchases"}
          </button>
        ))}
      </div>

      {loadError && (
        <div className="p-3 rounded-lg bg-red-50 dark:bg-red-900/20 text-sm text-red-700 dark:text-red-300">
          {loadError}
        </div>
      )}

      {tab === "entry" && (
        <>
          {saved && (
            <div className="p-4 rounded-xl bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 text-sm">
              <div className="font-bold text-emerald-800 dark:text-emerald-300">
                Saved GRN {saved.grnNo} ({saved.date}) — {saved.totals.qty} pcs,
                ₹{money(saved.totals.net)}
              </div>
              <div className="mt-2 flex flex-wrap gap-2">
                {saved.lines.map((l) => (
                  <span
                    key={l.barcode}
                    className="px-2 py-1 rounded bg-white dark:bg-slate-900 border border-emerald-200 dark:border-emerald-800 font-mono text-xs"
                  >
                    {l.barcode} · {l.productName} × {l.qty} · MRP {l.mrp}
                  </span>
                ))}
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 bg-white dark:bg-slate-900 p-5 rounded-xl border border-slate-200 dark:border-slate-800">
            <label>
              <span className={label}>Company *</span>
              <select
                className={field}
                value={company}
                onChange={(e) => {
                  setCompany(e.target.value);
                  setLines([newLine()]);
                }}
              >
                {opts?.companies.map((c) => (
                  <option key={c.name} value={c.name}>
                    {c.name}
                  </option>
                ))}
              </select>
              {prefix && (
                <span className="text-[10px] text-slate-400">
                  GRN series {prefix}…
                </span>
              )}
            </label>
            <label>
              <span className={label}>Warehouse *</span>
              <select
                className={field}
                value={warehouse}
                onChange={(e) => setWarehouse(e.target.value)}
              >
                {opts?.warehouses.map((w) => (
                  <option key={w} value={w}>
                    {w}
                  </option>
                ))}
              </select>
            </label>
            <label className="md:col-span-2">
              <span className={label}>Supplier *</span>
              <Input
                list="grn-suppliers"
                className={field}
                value={supplier}
                onChange={(e) => {
                  setSupplier(e.target.value.toUpperCase());
                  setDuplicateInvoice("");
                }}
                placeholder="Type to search"
              />
              {GRN_ATTRIBUTES.map((k) => (
                <datalist key={k} id={`grn-attr-${k}`}>
                  {suggestions[k].map((v) => (
                    <option key={v} value={v} />
                  ))}
                </datalist>
              ))}
              <datalist id="grn-suppliers">
                {opts?.suppliers.map((s) => (
                  <option key={s.name} value={s.name}>
                    {s.city}
                  </option>
                ))}
              </datalist>
            </label>
            <label>
              <span className={label}>Invoice no. *</span>
              <Input
                className={field}
                value={invoiceNo}
                onChange={(e) => {
                  setInvoiceNo(e.target.value);
                  setDuplicateInvoice("");
                }}
              />
            </label>
            <label>
              <span className={label}>Invoice date</span>
              <Input
                type="date"
                className={field}
                value={invoiceDate}
                onChange={(e) => setInvoiceDate(e.target.value)}
              />
            </label>
            <label>
              <span className={label}>Purchase date</span>
              <Input
                type="date"
                className={field}
                value={date}
                onChange={(e) => setDate(e.target.value)}
              />
            </label>
            <label>
              <span className={label}>Agent</span>
              <select
                className={field}
                value={agent}
                onChange={(e) => setAgent(e.target.value)}
              >
                <option value="">—</option>
                {opts?.agents.map((a) => (
                  <option key={a} value={a}>
                    {a}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 overflow-x-auto">
            <table className="w-full text-sm min-w-[1300px]">
              <thead className="bg-slate-50 dark:bg-slate-800/50 text-[10px] uppercase tracking-wider text-slate-500">
                <tr>
                  {[
                    "#",
                    "Product *",
                    "Qty *",
                    "Mtr",
                    "P.Rate *",
                    "Dis %",
                    "GST %",
                    "MRP *",
                    "Size",
                    "Brand",
                    "Pattern",
                    "Colour",
                    "Design",
                    "Rack",
                    "Amount",
                    "Net",
                    "",
                  ].map((h) => (
                    <th key={h} className="px-2 py-2 text-left">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {lines.map((l, i) => {
                  const c = calc(l);
                  const p = productByCode.get(l.productCode);
                  return (
                    <tr
                      key={l.key}
                      className="border-t border-slate-100 dark:border-slate-800 align-top"
                    >
                      <td className="px-2 py-1.5 text-slate-400">{i + 1}</td>
                      <td className="px-2 py-1.5 w-56">
                        <select
                          className={cell}
                          value={l.productCode}
                          onChange={(e) =>
                            setLine(l.key, { productCode: e.target.value })
                          }
                        >
                          <option value="">Select…</option>
                          {products.map((pr) => (
                            <option key={pr.code} value={pr.code}>
                              {pr.code} · {pr.name}
                            </option>
                          ))}
                        </select>
                        {p && (
                          <div className="text-[10px] text-slate-400 mt-0.5">
                            {p.unit} · {p.group} · {p.gstGroup}
                          </div>
                        )}
                      </td>
                      {(
                        ["qty", "mtr", "prate", "discountPercent"] as const
                      ).map((k) => (
                        <td key={k} className="px-1 py-1.5 w-20">
                          <Input
                            type="number"
                            className={cell}
                            value={l[k]}
                            onChange={(e) =>
                              setLine(l.key, { [k]: e.target.value })
                            }
                          />
                        </td>
                      ))}
                      <td className="px-1 py-1.5 w-20">
                        <Input
                          type="number"
                          className={cell}
                          value={l.gstPercent}
                          placeholder={l.productCode ? String(c.gstPct) : ""}
                          onChange={(e) =>
                            setLine(l.key, { gstPercent: e.target.value })
                          }
                        />
                      </td>
                      <td className="px-1 py-1.5 w-20">
                        <Input
                          type="number"
                          className={cell}
                          value={l.mrp}
                          onChange={(e) =>
                            setLine(l.key, { mrp: e.target.value })
                          }
                        />
                      </td>
                      {GRN_ATTRIBUTES.map((k) => (
                        <td key={k} className="px-1 py-1.5 w-24">
                          <Input
                            className={cell}
                            list={`grn-attr-${k}`}
                            aria-label={k}
                            value={l[k]}
                            onChange={(e) =>
                              setLine(l.key, {
                                [k]: e.target.value.toUpperCase(),
                              })
                            }
                          />
                        </td>
                      ))}
                      <td className="px-2 py-1.5 text-right tabular-nums">
                        {l.productCode ? money(c.amount) : ""}
                      </td>
                      <td className="px-2 py-1.5 text-right tabular-nums font-semibold">
                        {l.productCode ? money(c.net) : ""}
                      </td>
                      <td className="px-2 py-1.5">
                        <button
                          onClick={() =>
                            setLines((ls) =>
                              ls.length > 1
                                ? ls.filter((x) => x.key !== l.key)
                                : [newLine()],
                            )
                          }
                          className="p-1 text-slate-400 hover:text-red-600"
                          title="Remove line"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            <div className="flex items-center justify-between px-4 py-3 border-t border-slate-100 dark:border-slate-800">
              <Button
                onClick={() => setLines((ls) => [...ls, newLine()])}
                className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-bold bg-slate-100 dark:bg-slate-800 dark:text-slate-200"
              >
                <Plus className="w-4 h-4" /> Add line
              </Button>
              <div className="text-sm text-slate-600 dark:text-slate-300 flex gap-6 tabular-nums">
                <span>
                  Qty <b>{totals.qty}</b>
                </span>
                <span>
                  Taxable <b>₹{money(totals.taxable)}</b>
                </span>
                <span>
                  GST <b>₹{money(totals.gst)}</b>
                </span>
                <span>
                  Total <b>₹{money(totals.net)}</b>
                </span>
              </div>
            </div>
          </div>

          {error && (
            <div className="p-3 rounded-lg bg-red-50 dark:bg-red-900/20 text-sm text-red-700 dark:text-red-300">
              {error}
            </div>
          )}
          {duplicateInvoice && (
            <div
              role="alert"
              className="p-3 rounded-lg bg-amber-50 dark:bg-amber-900/20 text-sm text-amber-800 dark:text-amber-200 flex flex-wrap items-center justify-between gap-3"
            >
              <span>{duplicateInvoice}</span>
              <Button
                onClick={() => save(true)}
                disabled={saving}
                className="px-3 py-1.5 rounded-lg text-xs font-bold bg-amber-600 text-white disabled:opacity-50"
              >
                It's a different bill — save anyway
              </Button>
            </div>
          )}
          <div className="flex justify-end gap-2">
            <Button
              onClick={reset}
              className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold bg-slate-100 dark:bg-slate-800 dark:text-slate-200"
            >
              <RotateCcw className="w-4 h-4" /> Clear
            </Button>
            <Button
              onClick={() => save()}
              disabled={saving || !opts}
              className="flex items-center gap-2 px-5 py-2 rounded-lg text-sm font-bold bg-primary text-white disabled:opacity-50"
            >
              {saving ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Save className="w-4 h-4" />
              )}{" "}
              Save purchase
            </Button>
          </div>
        </>
      )}

      {tab === "list" && (
        <div className="space-y-3">
          <div className="flex gap-2">
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && loadList()}
              placeholder="GRN, supplier or invoice no."
              className="flex-1 px-3 py-2 text-sm bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg"
            />
            <Button
              onClick={loadList}
              className="px-4 py-2 rounded-lg text-sm font-bold bg-primary text-white"
            >
              Search
            </Button>
          </div>
          {listError && (
            <div className="p-3 rounded-lg bg-red-50 dark:bg-red-900/20 text-sm text-red-700 dark:text-red-300">
              {listError}
            </div>
          )}
          <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 dark:bg-slate-800/50 text-[10px] uppercase tracking-wider text-slate-500">
                <tr>
                  {[
                    "GRN",
                    "Date",
                    "Supplier",
                    "Invoice",
                    "Company",
                    "Qty",
                    "Taxable",
                    "GST",
                    "Total",
                    "",
                  ].map((h) => (
                    <th key={h} className="px-3 py-2 text-left">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {listLoading && (
                  <tr>
                    <td
                      colSpan={10}
                      className="px-3 py-8 text-center text-slate-400"
                    >
                      <Loader2 className="w-5 h-5 animate-spin inline" />{" "}
                      Loading…
                    </td>
                  </tr>
                )}
                {!listLoading &&
                  list.map((r) => (
                    <tr
                      key={r.grnNo}
                      className="hover:bg-slate-50 dark:hover:bg-slate-800/40"
                    >
                      <td className="px-3 py-2 font-mono">{r.grnNo}</td>
                      <td className="px-3 py-2">{r.date}</td>
                      <td className="px-3 py-2">{r.supplier}</td>
                      <td className="px-3 py-2">{r.invoiceNo}</td>
                      <td className="px-3 py-2 text-xs">{r.company}</td>
                      <td className="px-3 py-2 tabular-nums">{r.qty}</td>
                      <td className="px-3 py-2 tabular-nums">
                        {money(r.taxable)}
                      </td>
                      <td className="px-3 py-2 tabular-nums">{money(r.gst)}</td>
                      <td className="px-3 py-2 tabular-nums font-semibold">
                        {money(r.total)}
                      </td>
                      <td className="px-3 py-2">
                        <button
                          onClick={() => view(r.grnNo)}
                          className="p-1 text-slate-500 hover:text-primary"
                          title="View"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {viewing && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800">
              <div>
                <h3 className="font-bold text-slate-800 dark:text-white">
                  GRN {viewing.grnNo} · {viewing.date}
                </h3>
                <p className="text-xs text-slate-500">
                  {viewing.supplier} · Invoice {viewing.invoiceNo} ·{" "}
                  {viewing.company} · {viewing.warehouse}
                </p>
              </div>
              <button
                onClick={() => setViewing(null)}
                className="p-1 text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <table className="w-full text-sm">
              <thead className="text-[10px] uppercase tracking-wider text-slate-500 bg-slate-50 dark:bg-slate-800/50">
                <tr>
                  {[
                    "#",
                    "Barcode",
                    "Product",
                    "Qty",
                    "Rate",
                    "GST %",
                    "Net",
                    "MRP",
                    "Size / Brand",
                  ].map((h) => (
                    <th key={h} className="px-3 py-2 text-left">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {viewing.lines.map((l: any) => (
                  <tr key={l.barcode}>
                    <td className="px-3 py-1.5">{l.slNo}</td>
                    <td className="px-3 py-1.5 font-mono">{l.barcode}</td>
                    <td className="px-3 py-1.5">{l.productName}</td>
                    <td className="px-3 py-1.5">
                      {l.qty}
                      {l.mtr ? ` × ${l.mtr}m` : ""}
                    </td>
                    <td className="px-3 py-1.5">{money(l.prate)}</td>
                    <td className="px-3 py-1.5">{l.gstPercent}</td>
                    <td className="px-3 py-1.5">{money(l.netAmount)}</td>
                    <td className="px-3 py-1.5">{l.mrp}</td>
                    <td className="px-3 py-1.5 text-xs">
                      {[l.size, l.brand, l.pattern, l.color]
                        .filter(Boolean)
                        .join(" · ")}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="flex justify-between items-center px-6 py-4 border-t border-slate-100 dark:border-slate-800">
              <span className="text-xs text-slate-500" data-testid="grn-delete-unavailable">
                Deleting a GRN is unavailable: its stock and downstream reversal effects are not verified in SQL.
              </span>
              <span className="text-sm tabular-nums">
                Qty {viewing.totals.qty} · Taxable ₹
                {money(viewing.totals.taxable)} · GST ₹
                {money(viewing.totals.gst)}
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default GrnEntry;
