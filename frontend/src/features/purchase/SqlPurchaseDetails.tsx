import React, { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { FileText, Package, Receipt, TrendingUp } from "lucide-react";
import { Button } from "@/components/shared/Button";
import api from "../../services/api";
import PageHeader from "../../components/shared/Layout/PageHeader";

interface PurchaseLine {
  slNo: number;
  barcode: string;
  stockLinked: boolean;
  productCode: string;
  productName: string;
  hsnCode: string;
  qty: number;
  mtr: number;
  freeQty: number;
  prate: number;
  amount: number;
  discountPercent: number;
  gstPercent: number;
  gstAmount: number;
  netAmount: number;
  mrp: number;
  unit: string;
  brand: string;
  pattern: string;
  size: string;
}

interface Purchase {
  grnNo: string;
  company: string;
  warehouse: string;
  supplier: string;
  supplierCity: string;
  invoiceNo: string;
  invoiceDate: string;
  date: string;
  totals: { qty: number; taxable: number; gst: number };
  lines: PurchaseLine[];
}

const money = (value: number) =>
  Number(value || 0).toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

const SummaryCard: React.FC<{
  title: string;
  value: string;
  icon: React.ReactNode;
  tone: "primary" | "success" | "neutral" | "warning";
}> = ({ title, value, icon, tone }) => {
  const colors = {
    primary: "bg-primary/10 text-primary",
    success: "bg-success-soft text-success",
    neutral: "bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-300",
    warning: "bg-warning-soft text-warning",
  };
  const valueColors = {
    primary: "text-slate-900 dark:text-white",
    success: "text-success",
    neutral: "text-slate-900 dark:text-white",
    warning: "text-warning",
  };
  return (
    <div className="group rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm transition-all duration-300 hover:border-primary/20 dark:border-slate-700 dark:bg-slate-800 sm:p-8">
      <div className="mb-4 flex items-center gap-4">
        <div className={`rounded-sm p-3 transition-transform group-hover:scale-110 ${colors[tone]}`}>
          {icon}
        </div>
        <h2 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">{title}</h2>
      </div>
      <p className={`truncate text-2xl font-black tracking-tighter tabular-nums sm:text-3xl ${valueColors[tone]}`}>{value}</p>
    </div>
  );
};

const SqlPurchaseDetails: React.FC = () => {
  const { id = "" } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [purchase, setPurchase] = useState<Purchase | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError("");
    api
      .get(`/api/purchase-entry/${encodeURIComponent(id)}`)
      .then((res) => {
        if (active) setPurchase(res.data?.data ?? null);
      })
      .catch((err) => {
        if (active)
          setError(
            err.response?.data?.error?.message ||
              err.response?.data?.message ||
              "Could not load this purchase.",
          );
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [id]);

  const missingStock = purchase?.lines.filter((line) => !line.stockLinked).length ?? 0;
  const grandTotal = purchase ? purchase.totals.taxable + purchase.totals.gst : 0;

  return (
    <main className="min-h-full bg-app p-6 text-main">
      <div className="mx-auto max-w-7xl space-y-10 pb-24 pt-8">
        <PageHeader
          title={purchase ? `GRN ${purchase.grnNo}` : "GRN details"}
          description="Saved purchase record · Read only"
          breadcrumbs={[
            { label: "Home", link: "/dashboard" },
            { label: "Procurement", link: "/purchase" },
            { label: "Register", link: "/purchase/register" },
            { label: purchase?.grnNo ?? "GRN" },
          ]}
          actions={
            <Button variant="secondary" size="md" onClick={() => navigate("/purchase/register")}>
              Back to Register
            </Button>
          }
        />

        {loading ? (
          <div className="rounded-xl border border-slate-200 bg-white p-6 text-slate-500 shadow-sm dark:border-slate-700 dark:bg-slate-800">
            Loading purchase details…
          </div>
        ) : null}
        {error ? (
          <div role="alert" className="rounded-xl border border-danger/30 bg-white p-6 text-main shadow-sm dark:bg-slate-800">
            {error}
          </div>
        ) : null}

        {!loading && !error && purchase ? (
          <>
            <section className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-4">
              <SummaryCard title="GRN Total" value={`₹${money(grandTotal)}`} icon={<TrendingUp className="h-6 w-6" />} tone="primary" />
              <SummaryCard title="Taxable Amount" value={`₹${money(purchase.totals.taxable)}`} icon={<Receipt className="h-6 w-6" />} tone="success" />
              <SummaryCard title="GST Amount" value={`₹${money(purchase.totals.gst)}`} icon={<FileText className="h-6 w-6" />} tone="neutral" />
              <SummaryCard title="Line Items" value={String(purchase.lines.length)} icon={<Package className="h-6 w-6" />} tone={missingStock ? "warning" : "neutral"} />
            </section>

            {missingStock > 0 ? (
              <div role="status" className="rounded-xl border border-warning-line bg-warning-soft p-4 text-sm text-main">
                <strong>{missingStock} line{missingStock === 1 ? "" : "s"} have no matching stock row.</strong>{" "}
                Purchase details are shown as recorded; this page does not change stock or supplier balances.
              </div>
            ) : null}

            <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm dark:border-slate-700 dark:bg-slate-800">
              <div className="border-b border-slate-100 p-6 dark:border-slate-700 sm:p-8">
                <h2 className="text-sm font-black uppercase tracking-widest text-slate-900 dark:text-white">Purchase details</h2>
                <p className="mt-1 text-xs text-slate-500">Supplier invoice and recorded GRN information</p>
                <dl className="mt-6 grid gap-6 sm:grid-cols-2 xl:grid-cols-4">
                  <div><dt className="text-[10px] font-black uppercase tracking-widest text-slate-400">Supplier</dt><dd className="mt-1 text-sm font-bold text-slate-900 dark:text-white">{purchase.supplier || "—"}</dd>{purchase.supplierCity ? <dd className="text-xs text-slate-500">{purchase.supplierCity}</dd> : null}</div>
                  <div><dt className="text-[10px] font-black uppercase tracking-widest text-slate-400">Company / warehouse</dt><dd className="mt-1 text-sm font-bold text-slate-900 dark:text-white">{purchase.company || "—"}</dd><dd className="text-xs text-slate-500">{purchase.warehouse || "—"}</dd></div>
                  <div><dt className="text-[10px] font-black uppercase tracking-widest text-slate-400">Supplier invoice</dt><dd className="mt-1 text-sm font-bold text-slate-900 dark:text-white">{purchase.invoiceNo || "—"}</dd><dd className="text-xs text-slate-500">Invoice date: {purchase.invoiceDate || "—"}</dd></div>
                  <div><dt className="text-[10px] font-black uppercase tracking-widest text-slate-400">GRN date</dt><dd className="mt-1 text-sm font-bold text-slate-900 dark:text-white">{purchase.date || "—"}</dd></div>
                </dl>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full min-w-[1050px] table-fixed border-collapse text-left [&_td]:border [&_td]:border-slate-200 [&_th]:border [&_th]:border-slate-200 dark:[&_td]:border-slate-700 dark:[&_th]:border-slate-700">
                  <colgroup>
                    <col style={{ width: "4%" }} /><col style={{ width: "11%" }} /><col style={{ width: "19%" }} /><col style={{ width: "8%" }} />
                    <col style={{ width: "8%" }} /><col style={{ width: "11%" }} /><col style={{ width: "11%" }} /><col style={{ width: "9%" }} />
                    <col style={{ width: "9%" }} /><col style={{ width: "10%" }} />
                  </colgroup>
                  <thead className="border-b border-slate-100 bg-slate-50 dark:border-slate-700 dark:bg-slate-900/50">
                    <tr>
                      {["#", "Barcode", "Product", "Qty", "Metres", "Purchase rate", "Amount", "GST", "MRP", "Net"].map((label, i) => (
                        <th key={label} className={`whitespace-nowrap px-4 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400 ${i >= 3 ? "text-right" : "text-left"}`}>{label}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                    {purchase.lines.map((line) => (
                      <tr key={`${line.slNo}-${line.barcode}`} className="transition-colors hover:bg-slate-50/70 dark:hover:bg-slate-900/40">
                        <td className="px-4 py-4 text-xs font-bold text-slate-400">{line.slNo}</td>
                        <td className="px-4 py-4 font-mono text-xs text-primary">
                          {line.barcode || "—"}
                          {!line.stockLinked ? <span className="mt-1 block font-sans text-[10px] font-semibold text-warning">No stock row</span> : null}
                        </td>
                        <td className="px-4 py-4">
                          <div className="text-xs font-black uppercase tracking-tight text-slate-900 dark:text-white">{line.productName || "—"}</div>
                          <div className="mt-1 text-[10px] font-bold uppercase tracking-wide text-slate-400">{line.productCode}{line.hsnCode ? ` · HSN ${line.hsnCode}` : ""}{line.size ? ` · ${line.size}` : ""}{line.brand ? ` · ${line.brand}` : ""}{line.pattern ? ` · ${line.pattern}` : ""}</div>
                        </td>
                        <td className="whitespace-nowrap px-4 py-4 text-right text-xs font-bold tabular-nums text-slate-700 dark:text-slate-200">{line.qty}{line.freeQty ? <span className="block text-[10px] font-medium text-slate-400">+{line.freeQty} free</span> : null}</td>
                        <td className="whitespace-nowrap px-4 py-4 text-right text-xs font-bold tabular-nums text-slate-700 dark:text-slate-200">{line.mtr || "—"}</td>
                        <td className="whitespace-nowrap px-4 py-4 text-right text-xs font-bold tabular-nums text-slate-700 dark:text-slate-200">₹{money(line.prate)}{line.discountPercent ? <span className="block text-[10px] font-medium text-slate-400">{line.discountPercent}% disc.</span> : null}</td>
                        <td className="whitespace-nowrap px-4 py-4 text-right text-xs font-bold tabular-nums text-slate-700 dark:text-slate-200">₹{money(line.amount)}</td>
                        <td className="whitespace-nowrap px-4 py-4 text-right text-xs font-bold tabular-nums text-slate-700 dark:text-slate-200">{line.gstPercent}%<span className="block text-[10px] font-medium text-slate-400">₹{money(line.gstAmount)}</span></td>
                        <td className="whitespace-nowrap px-4 py-4 text-right text-xs font-bold tabular-nums text-slate-700 dark:text-slate-200">₹{money(line.mrp)}</td>
                        <td className="whitespace-nowrap px-4 py-4 text-right text-xs font-black tabular-nums text-slate-900 dark:text-white">₹{money(line.netAmount)}</td>
                      </tr>
                    ))}
                    {!purchase.lines.length ? (
                      <tr><td colSpan={10} className="px-8 py-20 text-center text-xs font-bold text-slate-400">No purchase lines were found for this GRN.</td></tr>
                    ) : null}
                  </tbody>
                </table>
              </div>

              <div className="flex justify-end border-t border-slate-100 bg-slate-50/50 p-6 dark:border-slate-700 dark:bg-slate-900/50 sm:p-8">
                <dl className="w-full max-w-sm space-y-3 text-xs">
                  <div className="flex justify-between"><dt className="font-bold uppercase tracking-widest text-slate-400">Quantity</dt><dd className="font-black tabular-nums text-slate-900 dark:text-white">{purchase.totals.qty}</dd></div>
                  <div className="flex justify-between"><dt className="font-bold uppercase tracking-widest text-slate-400">Taxable amount</dt><dd className="font-bold tabular-nums text-slate-700 dark:text-slate-200">₹{money(purchase.totals.taxable)}</dd></div>
                  <div className="flex justify-between"><dt className="font-bold uppercase tracking-widest text-slate-400">GST</dt><dd className="font-bold tabular-nums text-slate-700 dark:text-slate-200">₹{money(purchase.totals.gst)}</dd></div>
                  <div className="flex justify-between border-t border-slate-200 pt-3 dark:border-slate-600"><dt className="font-black uppercase tracking-widest text-slate-900 dark:text-white">Grand total</dt><dd className="font-black tabular-nums text-slate-900 dark:text-white">₹{money(grandTotal)}</dd></div>
                </dl>
              </div>
            </section>
          </>
        ) : null}
        {!loading && !error && !purchase ? (
          <section className="rounded-xl border border-slate-200 bg-white p-6 text-sm text-slate-600 shadow-sm dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300">
            Purchase not found. <Link className="ml-2 font-semibold text-primary hover:underline" to="/purchase/register">Return to register</Link>
          </section>
        ) : null}
      </div>
    </main>
  );
};

export default SqlPurchaseDetails;
