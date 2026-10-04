import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Plus, Edit, Trash2, X, Loader2, Search, Lock } from "lucide-react";
import api from "../../services/api";
import PageHeader from "../../components/shared/Layout/PageHeader";
import { Button } from "@/components/shared/Button";
import { Input } from "@/components/shared/Input";

/**
 * Product master -- Textilesoft's newproduct table (via /api/product-master). One product is shown once with
 * the companies it's set up for; Textilesoft keeps one row per company behind the scenes.
 */
interface Product {
  code: string;
  name: string;
  printName: string;
  nameTamil: string;
  printNameTamil: string;
  unit: string;
  group: string;
  subGroup: string;
  floor: string;
  gstGroup: string;
  hsnCode: string;
  discountPercent: string;
  commissionPercent: string;
  commissionAmount: string;
  mrp: string;
  retailRate: string;
  wholesaleRate: string;
  companies: string[];
  racks: string[];
  fashions: string[];
  purchased?: boolean;
}

interface Options {
  units: string[];
  groups: string[];
  subGroups: string[];
  floors: string[];
  gstGroups: string[];
  companies: string[];
  racks: string[];
  fashions: string[];
}

type Form = Omit<Product, "purchased">;

const EMPTY: Form = {
  code: "",
  name: "",
  printName: "",
  nameTamil: "",
  printNameTamil: "",
  unit: "",
  group: "",
  subGroup: "",
  floor: "",
  gstGroup: "",
  hsnCode: "",
  discountPercent: "",
  commissionPercent: "",
  commissionAmount: "",
  mrp: "",
  retailRate: "",
  wholesaleRate: "",
  companies: [],
  racks: [],
  fashions: [],
};

const errorText = (err: unknown, fallback: string): string =>
  (err as { response?: { data?: { message?: string } } })?.response?.data
    ?.message || fallback;

const fieldClass =
  "w-full mt-1 px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm outline-none focus:ring-2 focus:ring-primary";
const labelClass =
  "text-[10px] font-bold uppercase tracking-wider text-slate-500";

const Select: React.FC<{
  label: string;
  value: string;
  options: string[];
  onChange: (v: string) => void;
  required?: boolean;
}> = ({ label, value, options, onChange, required }) => (
  <label className="block">
    <span className={labelClass}>
      {label}
      {required && " *"}
    </span>
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className={fieldClass}
    >
      <option value="">{required ? "Select…" : "—"}</option>
      {options.map((o) => (
        <option key={o} value={o}>
          {o}
        </option>
      ))}
    </select>
  </label>
);

const Text: React.FC<{
  label: string;
  value: string;
  onChange: (v: string) => void;
  required?: boolean;
  type?: string;
  placeholder?: string;
}> = ({ label, value, onChange, required, type = "text", placeholder }) => (
  <label className="block">
    <span className={labelClass}>
      {label}
      {required && " *"}
    </span>
    <Input
      type={type}
      value={value}
      placeholder={placeholder}
      onChange={(e) => onChange(e.target.value)}
      className={fieldClass}
    />
  </label>
);

const ProductMaster: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [options, setOptions] = useState<Options>({
    units: [],
    groups: [],
    subGroups: [],
    floors: [],
    gstGroups: [],
    companies: [],
    racks: [],
    fashions: [],
  });
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [search, setSearch] = useState("");
  const [company, setCompany] = useState("");
  const [group, setGroup] = useState("");

  const [editing, setEditing] = useState<Form | null>(null);
  const [isNew, setIsNew] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState("");
  const [confirmDelete, setConfirmDelete] = useState<Product | null>(null);
  const [deleteError, setDeleteError] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setLoadError("");
    try {
      const [list, opts] = await Promise.all([
        api.get("/api/product-master"),
        api.get("/api/product-master/options"),
      ]);
      setProducts(list.data?.data ?? []);
      setOptions(opts.data?.data ?? options);
    } catch (err) {
      setLoadError(
        errorText(err, "Could not load products from the shop database."),
      );
    } finally {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const visible = useMemo(() => {
    const s = search.trim().toUpperCase();
    return products.filter(
      (p) =>
        (!s ||
          p.name.toUpperCase().includes(s) ||
          p.code.includes(s) ||
          p.printName.toUpperCase().includes(s)) &&
        (!company || p.companies.includes(company)) &&
        (!group || p.group === group),
    );
  }, [products, search, company, group]);

  const openNew = () => {
    setEditing({
      ...EMPTY,
      unit: options.units.includes("PCS") ? "PCS" : "",
      companies: options.companies.length === 1 ? [...options.companies] : [],
    });
    setIsNew(true);
    setFormError("");
  };
  const openEdit = (p: Product) => {
    const { purchased: _purchased, ...rest } = p;
    setEditing(rest);
    setIsNew(false);
    setFormError("");
  };
  const set = <K extends keyof Form>(key: K, value: Form[K]) =>
    setEditing((f) => (f ? { ...f, [key]: value } : f));
  const toggle = (key: "companies" | "racks" | "fashions", v: string) =>
    setEditing((f) =>
      f
        ? {
            ...f,
            [key]: f[key].includes(v)
              ? f[key].filter((x) => x !== v)
              : [...f[key], v],
          }
        : f,
    );

  const save = async () => {
    if (!editing) return;
    if (!editing.name.trim()) return setFormError("Enter the product name.");
    if (!editing.unit) return setFormError("Select the unit.");
    if (!editing.gstGroup) return setFormError("Select the GST group.");
    if (!editing.companies.length)
      return setFormError("Select at least one company.");
    setSaving(true);
    setFormError("");
    try {
      const { code, ...body } = editing;
      const res = isNew
        ? await api.post("/api/product-master", {
            ...body,
            ...(code.trim() ? { code: code.trim() } : {}),
          })
        : await api.put(
            `/api/product-master/${encodeURIComponent(code)}`,
            body,
          );
      const saved: Product = res.data?.data;
      setProducts((list) => {
        const others = list.filter((p) => p.code !== saved.code);
        return [...others, saved].sort(
          (a, b) =>
            Number(a.code) - Number(b.code) || a.code.localeCompare(b.code),
        );
      });
      setEditing(null);
    } catch (err) {
      setFormError(errorText(err, "Could not save the product."));
    } finally {
      setSaving(false);
    }
  };

  const remove = async () => {
    if (!confirmDelete) return;
    setDeleteError("");
    try {
      await api.delete(
        `/api/product-master/${encodeURIComponent(confirmDelete.code)}`,
      );
      setProducts((list) => list.filter((p) => p.code !== confirmDelete.code));
      setConfirmDelete(null);
    } catch (err) {
      setDeleteError(errorText(err, "Could not delete the product."));
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Product Master"
        description="Product names, units, groups and GST groups — saved straight into Textilesoft (newproduct)."
      />

      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[220px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search name or code…"
            className="w-full pl-9 pr-3 py-2 text-sm bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg"
          />
        </div>
        <select
          value={company}
          onChange={(e) => setCompany(e.target.value)}
          className="px-3 py-2 text-sm bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg"
        >
          <option value="">All companies</option>
          {options.companies.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
        <select
          value={group}
          onChange={(e) => setGroup(e.target.value)}
          className="px-3 py-2 text-sm bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg"
        >
          <option value="">All groups</option>
          {options.groups.map((g) => (
            <option key={g} value={g}>
              {g}
            </option>
          ))}
        </select>
        <Button
          onClick={openNew}
          className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg text-sm font-bold"
        >
          <Plus className="w-4 h-4" /> New product
        </Button>
      </div>

      {loadError && (
        <div className="p-3 rounded-lg bg-red-50 dark:bg-red-900/20 text-sm text-red-700 dark:text-red-300">
          {loadError}
        </div>
      )}

      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 dark:bg-slate-800/50 text-[10px] uppercase tracking-wider text-slate-500">
            <tr>
              <th className="px-4 py-3 text-left">Code</th>
              <th className="px-4 py-3 text-left">Product</th>
              <th className="px-4 py-3 text-left">Group</th>
              <th className="px-4 py-3 text-left">Unit</th>
              <th className="px-4 py-3 text-left">GST group</th>
              <th className="px-4 py-3 text-left">HSN</th>
              <th className="px-4 py-3 text-left">Companies</th>
              <th className="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
            {loading && (
              <tr>
                <td
                  colSpan={8}
                  className="px-4 py-10 text-center text-slate-400"
                >
                  <Loader2 className="w-5 h-5 animate-spin inline" /> Loading
                  products…
                </td>
              </tr>
            )}
            {!loading && visible.length === 0 && !loadError && (
              <tr>
                <td
                  colSpan={8}
                  className="px-4 py-10 text-center text-slate-400"
                >
                  No products match.
                </td>
              </tr>
            )}
            {!loading &&
              visible.map((p) => (
                <tr
                  key={p.code}
                  className="hover:bg-slate-50 dark:hover:bg-slate-800/40"
                >
                  <td className="px-4 py-2 font-mono text-slate-500">
                    {p.code}
                  </td>
                  <td className="px-4 py-2">
                    <div className="font-semibold text-slate-800 dark:text-slate-100">
                      {p.name}
                    </div>
                    {p.printName && p.printName !== p.name && (
                      <div className="text-xs text-slate-400">
                        {p.printName}
                      </div>
                    )}
                  </td>
                  <td className="px-4 py-2">
                    {p.group || "—"}
                    {p.subGroup && (
                      <span className="text-slate-400"> / {p.subGroup}</span>
                    )}
                  </td>
                  <td className="px-4 py-2">{p.unit || "—"}</td>
                  <td className="px-4 py-2">{p.gstGroup || "—"}</td>
                  <td className="px-4 py-2">{p.hsnCode || "—"}</td>
                  <td className="px-4 py-2 text-xs">
                    {p.companies.join(", ")}
                  </td>
                  <td className="px-4 py-2 text-right whitespace-nowrap">
                    <button
                      onClick={() => openEdit(p)}
                      className="p-1.5 text-slate-500 hover:text-primary"
                      title="Edit"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    {p.purchased ? (
                      <span
                        className="inline-block p-1.5 text-slate-300"
                        title="Already purchased — can't be deleted"
                      >
                        <Lock className="w-4 h-4" />
                      </span>
                    ) : (
                      <button
                        onClick={() => {
                          setConfirmDelete(p);
                          setDeleteError("");
                        }}
                        className="p-1.5 text-slate-500 hover:text-red-600"
                        title="Delete"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </td>
                </tr>
              ))}
          </tbody>
        </table>
      </div>
      {!loading && (
        <p className="text-xs text-slate-400">
          {visible.length} of {products.length} products
        </p>
      )}

      {editing && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800">
              <h3 className="font-bold text-slate-800 dark:text-white">
                {isNew ? "New product" : `Edit product ${editing.code}`}
              </h3>
              <button
                onClick={() => setEditing(null)}
                className="p-1 text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 grid grid-cols-1 md:grid-cols-3 gap-4">
              {isNew && (
                <Text
                  label="Code"
                  value={editing.code}
                  onChange={(v) => set("code", v)}
                  placeholder="Automatic"
                />
              )}
              <div className={isNew ? "md:col-span-2" : "md:col-span-3"}>
                <Text
                  label="Product name"
                  required
                  value={editing.name}
                  onChange={(v) => set("name", v)}
                />
              </div>
              <Text
                label="Print name"
                value={editing.printName}
                onChange={(v) => set("printName", v)}
                placeholder="Same as name"
              />
              <Text
                label="Name (Tamil)"
                value={editing.nameTamil}
                onChange={(v) => set("nameTamil", v)}
              />
              <Text
                label="Print name (Tamil)"
                value={editing.printNameTamil}
                onChange={(v) => set("printNameTamil", v)}
              />
              <Select
                label="Unit"
                required
                value={editing.unit}
                options={options.units}
                onChange={(v) => set("unit", v)}
              />
              <Select
                label="Group"
                value={editing.group}
                options={options.groups}
                onChange={(v) => set("group", v)}
              />
              <Select
                label="Sub group"
                value={editing.subGroup}
                options={options.subGroups}
                onChange={(v) => set("subGroup", v)}
              />
              <Select
                label="Floor"
                value={editing.floor}
                options={options.floors}
                onChange={(v) => set("floor", v)}
              />
              <Select
                label="GST group"
                required
                value={editing.gstGroup}
                options={options.gstGroups}
                onChange={(v) => set("gstGroup", v)}
              />
              <Text
                label="HSN code"
                value={editing.hsnCode}
                onChange={(v) => set("hsnCode", v)}
              />
              <Text
                label="Discount %"
                type="number"
                value={editing.discountPercent}
                onChange={(v) => set("discountPercent", v)}
              />
              <Text
                label="Commission %"
                type="number"
                value={editing.commissionPercent}
                onChange={(v) => set("commissionPercent", v)}
              />
              <Text
                label="Commission amount"
                type="number"
                value={editing.commissionAmount}
                onChange={(v) => set("commissionAmount", v)}
              />
              <Text
                label="MRP"
                type="number"
                value={editing.mrp}
                onChange={(v) => set("mrp", v)}
              />
              <Text
                label="Retail rate"
                type="number"
                value={editing.retailRate}
                onChange={(v) => set("retailRate", v)}
              />
              <Text
                label="Wholesale rate"
                type="number"
                value={editing.wholesaleRate}
                onChange={(v) => set("wholesaleRate", v)}
              />
              {(
                [
                  ["companies", "Companies *", options.companies],
                  ["racks", "Racks", options.racks],
                  ["fashions", "Fashion names", options.fashions],
                ] as const
              ).map(
                ([key, title, values]) =>
                  (values.length > 0 || key === "companies") && (
                    <div key={key} className="md:col-span-3">
                      <span className={labelClass}>{title}</span>
                      <div className="mt-2 flex flex-wrap gap-2">
                        {values.map((v) => (
                          <label
                            key={v}
                            className={`px-3 py-1.5 rounded-lg border text-xs font-semibold cursor-pointer ${editing[key].includes(v) ? "bg-primary text-white border-primary" : "border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300"}`}
                          >
                            <input
                              type="checkbox"
                              className="sr-only"
                              checked={editing[key].includes(v)}
                              onChange={() => toggle(key, v)}
                            />
                            {v}
                          </label>
                        ))}
                      </div>
                    </div>
                  ),
              )}
            </div>
            {formError && (
              <div className="mx-6 mb-2 p-3 rounded-lg bg-red-50 dark:bg-red-900/20 text-sm text-red-700 dark:text-red-300">
                {formError}
              </div>
            )}
            <div className="flex justify-end gap-2 px-6 py-4 border-t border-slate-100 dark:border-slate-800">
              <Button
                onClick={() => setEditing(null)}
                className="px-4 py-2 rounded-lg text-sm font-bold bg-slate-100 dark:bg-slate-800 dark:text-slate-200"
              >
                Cancel
              </Button>
              <Button
                onClick={save}
                disabled={saving}
                className="px-4 py-2 rounded-lg text-sm font-bold bg-primary text-white disabled:opacity-50 flex items-center gap-2"
              >
                {saving && <Loader2 className="w-4 h-4 animate-spin" />} Save
              </Button>
            </div>
          </div>
        </div>
      )}

      {confirmDelete && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-md p-6 space-y-4">
            <h3 className="font-bold text-slate-800 dark:text-white">
              Delete {confirmDelete.name}?
            </h3>
            <p className="text-sm text-slate-500">
              This removes product {confirmDelete.code} for{" "}
              {confirmDelete.companies.join(" and ")} from Textilesoft.
            </p>
            {deleteError && (
              <div className="p-3 rounded-lg bg-red-50 dark:bg-red-900/20 text-sm text-red-700 dark:text-red-300">
                {deleteError}
              </div>
            )}
            <div className="flex justify-end gap-2">
              <Button
                onClick={() => setConfirmDelete(null)}
                className="px-4 py-2 rounded-lg text-sm font-bold bg-slate-100 dark:bg-slate-800 dark:text-slate-200"
              >
                Cancel
              </Button>
              <Button
                onClick={remove}
                className="px-4 py-2 rounded-lg text-sm font-bold bg-red-600 text-white"
              >
                Delete
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProductMaster;
