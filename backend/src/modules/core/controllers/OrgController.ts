/**
 * Company / Branch / Warehouse / Counter endpoints -- all data lives in Textilesoft's SQL tables
 * (see integrations/textilesoft/sqlOrg.ts). No MongoDB.
 *
 *   /api/branches, /api/stores  -> branchdetail (+ every branch lists the shop's billing counters)
 *   /api/companies              -> companydetail
 *   /api/warehouses             -> warehousedetail
 *   /api/counters               -> countername + CommonSettings
 */
import {
  listCompanies,
  createCompany,
  updateCompany,
  deleteCompany,
  listLocations,
  createLocation,
  updateLocation,
  deleteLocation,
  type SqlLocation,
  listCounters,
  createCounter,
  deleteCounter,
  updateCounterSettings,
  type SqlCounterInfo,
} from "../../../integrations/textilesoft/sqlOrg.js";
import { SqlWriteError } from "../../../integrations/textilesoft/sqlWrite.js";
import { sqlRoute as sql } from "../../../integrations/textilesoft/sqlRoute.js";

// ---------------------------------------------------------------- branches (ERP's branch/store list)

const toCounter = (c: SqlCounterInfo) => ({
  id: c.id,
  name: c.name,
  mode: c.mode,
  lastBillNumber: 0,
});

/** Shape the existing ERP screens use for a branch/store. */
function toErpBranch(
  b: SqlLocation,
  index: number,
  counters: SqlCounterInfo[],
) {
  return {
    _id: b.code,
    id: b.code,
    code: b.code,
    name: b.name,
    address: b.address,
    city: b.city,
    phone: b.phone || b.mobile,
    email: b.email,
    gstin: b.gstin,
    landmark: b.landmark,
    isMain: index === 0,
    status: "ACTIVE",
    is_active: true,
    isActive: true,
    // Textilesoft's counters are shop-wide, not per branch.
    counters: counters.map(toCounter),
    source: "sql",
  };
}

async function erpBranches() {
  const [branches, counters] = await Promise.all([
    listLocations("branchdetail"),
    listCounters(),
  ]);
  return branches.map((b, i) => toErpBranch(b, i, counters));
}

export const getBranches = sql(async (_req, res) => {
  res.json(await erpBranches());
});

export const getBranch = sql(async (req, res) => {
  const b = (await erpBranches()).find((x) => x.id === req.params.id);
  if (!b) throw new SqlWriteError("Branch not found.", 404);
  res.json(b);
});

export const createBranch = sql(async (req, res) => {
  const created = await createLocation("branchdetail", req.body ?? {});
  res
    .status(201)
    .json((await erpBranches()).find((b) => b.id === created.code));
});

/**
 * Updates branch fields; `counters` (from the Branch settings screen) is applied to Textilesoft's shop-wide
 * counter list: new ids are added, missing ids deleted. Renaming a counter isn't possible in Textilesoft
 * (bills reference the counter by name), so a changed name is refused.
 */
export const updateBranch = sql(async (req, res) => {
  const id = String(req.params.id);
  const { counters, ...fields } = req.body ?? {};
  if (Object.keys(fields).length)
    await updateLocation("branchdetail", id, fields);
  if (Array.isArray(counters)) await syncCounters(counters);
  const b = (await erpBranches()).find((x) => x.id === id);
  if (!b) throw new SqlWriteError("Branch not found.", 404);
  res.json(b);
});

export const deleteBranch = sql(async (req, res) => {
  await deleteLocation("branchdetail", String(req.params.id));
  res.json({ message: "Branch deleted" });
});

async function syncCounters(wanted: { id?: string; name?: string }[]) {
  const current = await listCounters();
  const want = wanted.map((c) => ({
    id: String(c.id ?? c.name ?? "")
      .trim()
      .toUpperCase(),
    name: String(c.name ?? c.id ?? "")
      .trim()
      .toUpperCase(),
  }));
  const renamed = want.filter((c) => c.name && c.name !== c.id);
  if (renamed.length)
    throw new SqlWriteError(
      `Counters can't be renamed in Textilesoft (bills use the counter name): ${renamed.map((c) => c.id).join(", ")}.`,
      400,
    );
  const have = new Set(current.map((c) => c.id.toUpperCase()));
  const keep = new Set(want.map((c) => c.id));
  for (const c of want) if (c.id && !have.has(c.id)) await createCounter(c.id);
  for (const c of current)
    if (!keep.has(c.id.toUpperCase())) await deleteCounter(c.id);
}

// ---------------------------------------------------------------- companies

export const getCompanies = sql(async (_req, res) => {
  res.json({ success: true, data: await listCompanies() });
});
export const postCompany = sql(async (req, res) => {
  res
    .status(201)
    .json({ success: true, data: await createCompany(req.body ?? {}) });
});
export const putCompany = sql(async (req, res) => {
  res.json({
    success: true,
    data: await updateCompany(String(req.params.code), req.body ?? {}),
  });
});
export const removeCompany = sql(async (req, res) => {
  await deleteCompany(String(req.params.code));
  res.json({ success: true });
});

// ---------------------------------------------------------------- warehouses

export const getWarehouses = sql(async (_req, res) => {
  res.json({ success: true, data: await listLocations("warehousedetail") });
});
export const postWarehouse = sql(async (req, res) => {
  res
    .status(201)
    .json({
      success: true,
      data: await createLocation("warehousedetail", req.body ?? {}),
    });
});
export const putWarehouse = sql(async (req, res) => {
  res.json({
    success: true,
    data: await updateLocation(
      "warehousedetail",
      String(req.params.code),
      req.body ?? {},
    ),
  });
});
export const removeWarehouse = sql(async (req, res) => {
  await deleteLocation("warehousedetail", String(req.params.code));
  res.json({ success: true });
});

// ---------------------------------------------------------------- counters

export const getCounters = sql(async (_req, res) => {
  res.json({ success: true, data: await listCounters() });
});
export const postCounter = sql(async (req, res) => {
  res
    .status(201)
    .json({
      success: true,
      data: await createCounter(String(req.body?.name ?? "")),
    });
});
export const removeCounter = sql(async (req, res) => {
  await deleteCounter(String(req.params.name));
  res.json({ success: true });
});
export const putCounterSettings = sql(async (req, res) => {
  res.json({
    success: true,
    data: await updateCounterSettings(String(req.params.name), req.body ?? {}),
  });
});
