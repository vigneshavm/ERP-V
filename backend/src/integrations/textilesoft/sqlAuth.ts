/**
 * ERP login against Textilesoft's own user table (dbo.newuser) -- no MongoDB involved.
 *
 * Textilesoft's login.aspx (read from its compiled App_Web_login.aspx dll) runs two queries -- one by
 * user_id ("UserId InCorrect") and one by user_id + pass ("Password InCorrect"). The ERP runs ONE query
 * (user_id + pass): same accept/reject result, but an unknown ID and a wrong password now take the same
 * path and the same time, so neither the message nor the response time tells an attacker which IDs exist.
 * The password comparison is done by SQL Server (not in JS) so it follows the database collation exactly
 * like Textilesoft does (normally case-insensitive, trailing spaces ignored). Values are parameterised.
 *
 * newuser.active is NOT checked: in the shop's data every user has active = '0' and still logs into
 * Textilesoft, so Textilesoft does not enforce it (checked against SSS_copy, Sep 2026).
 *
 * Not copied from Textilesoft, on purpose:
 *   - the counter / licence check (countername.year_to) -- the ERP login does not pick a counter;
 *   - the writes it does after login (newuser.statues = '1', AccountDate insert) -- the ERP's SQL login
 *     is read-only. Textilesoft keeps doing those for its own logins.
 *
 * Sessions are stateless: the JWT carries the Textilesoft user plus a password stamp (`pwv`, an HMAC of
 * NewUser_ID + pass keyed with JWT_SECRET). `protect` re-reads the user from SQL (cached for a minute) and
 * re-derives the role from that row, so within ~1 minute:
 *   - deleting the user in Textilesoft logs them out of the ERP,
 *   - changing their password in Textilesoft logs out every existing ERP session of that user,
 *   - changing their rights changes their ERP role.
 * If the shop DB is down, the last known state is used for at most STALE_MAX_MS, then requests fail (503).
 */
import crypto from "crypto";
import jwt from "jsonwebtoken";
import { getShopPool } from "./shopDbPool.js";
import { info, warn } from "../../config/logger.js";
import { readDiscountLimits } from "./sqlUserAdmin.js";

export type ErpRole = "owner" | "staff";

export interface SqlUser {
  /** dbo.newuser.NewUser_ID */
  sqlUserId: number;
  /** Login name (dbo.newuser.user_id). */
  userId: string;
  name: string;
  rights: string;
  counterName: string;
  mode: string;
  active: boolean;
  role: ErpRole;
  /** HMAC of NewUser_ID + current password (never the password itself). Changes when the password does. */
  pwStamp: string;
}

export class SqlAuthError extends Error {
  constructor(
    message: string,
    public statusCode: number,
    public code: string,
  ) {
    super(message);
  }
}

/** AUTH_SOURCE=sql (default) or mongo (old ERP user accounts). */
export function isSqlAuth(env: NodeJS.ProcessEnv = process.env): boolean {
  return (env.AUTH_SOURCE || "sql").trim().toLowerCase() !== "mongo";
}

const clean = (v: unknown): string => String(v ?? "").trim();

/** Textilesoft's "Active" radio stores 1 = Yes, 0 = No. */
const isActive = (v: unknown): boolean =>
  /^(1|y|yes|true|active)$/i.test(clean(v));

const list = (v: string | undefined, dflt = ""): string[] =>
  (v ?? dflt)
    .split(",")
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean);

/**
 * Textilesoft user -> ERP role. Owner when the user ID is in TEXTILESOFT_OWNER_USERS or the rights value
 * (dbo.rightsentry.r_name) is in TEXTILESOFT_OWNER_RIGHTS (both comma separated, case-insensitive).
 * Everyone else is staff. (In the shop's data nearly every user has rights "PURCHASE", so the user list
 * is what actually picks the owners.)
 */
export function roleFor(
  userId: string,
  rights: string,
  env: NodeJS.ProcessEnv = process.env,
): ErpRole {
  if (list(env.TEXTILESOFT_OWNER_USERS).includes(userId.trim().toLowerCase()))
    return "owner";
  if (
    list(env.TEXTILESOFT_OWNER_RIGHTS, "admin").includes(
      rights.trim().toLowerCase(),
    )
  )
    return "owner";
  return "staff";
}

/**
 * Keyed so a token holder can't brute-force a short plaintext password from the stamp in their JWT.
 * Uses the raw stored value: any edit of the password in Textilesoft (even case) gives a new stamp.
 */
export function passwordStamp(sqlUserId: number, pass: unknown): string {
  return crypto
    .createHmac("sha256", String(process.env.JWT_SECRET ?? ""))
    .update(`${sqlUserId}:${String(pass ?? "")}`)
    .digest("hex")
    .slice(0, 32);
}

function toSqlUser(r: Record<string, unknown>): SqlUser {
  const rights = clean(r.rights);
  return {
    sqlUserId: Number(r.NewUser_ID),
    userId: clean(r.user_id),
    name: clean(r.name) || clean(r.user_id),
    rights,
    counterName: clean(r.counter_name),
    mode: clean(r.mode),
    active: isActive(r.active),
    role: roleFor(clean(r.user_id), rights),
    pwStamp: passwordStamp(Number(r.NewUser_ID), r.pass),
  };
}

// `pass` is read only to compute pwStamp in toSqlUser; it is never kept, cached or logged.
const USER_COLUMNS =
  "NewUser_ID, name, user_id, rights, counter_name, mode, active, pass";

async function query(
  text: string,
  params: Record<string, unknown>,
): Promise<Record<string, unknown>[]> {
  let pool;
  try {
    pool = await getShopPool();
  } catch (err) {
    warn(`[sql-auth] shop database unavailable - ${(err as Error).message}`);
    throw new SqlAuthError(
      "Shop database is not reachable. Please try again in a moment.",
      503,
      "AUTH_SQL_UNAVAILABLE",
    );
  }
  const req = pool.request();
  for (const [k, v] of Object.entries(params)) req.input(k, v);
  try {
    const res = await req.query(text);
    return res ? res.recordset : [];
  } catch (err) {
    warn(`[sql-auth] query failed - ${(err as Error).message}`);
    throw new SqlAuthError(
      "Shop database is not reachable. Please try again in a moment.",
      503,
      "AUTH_SQL_UNAVAILABLE",
    );
  }
}

/** Checks a Textilesoft user ID + password. Throws SqlAuthError (401/403/503) when login is refused. */
export async function verifySqlLogin(
  userId: string,
  password: string,
): Promise<SqlUser> {
  const id = clean(userId);
  if (!id || !password)
    throw new SqlAuthError(
      "Please enter user ID and password",
      400,
      "AUTH_MISSING",
    );

  const invalid = new SqlAuthError(
    "Invalid user ID or password",
    401,
    "AUTH_INVALID",
  );

  // One query for both "unknown ID" and "wrong password" (see header). If a user_id appears on more than
  // one row, the row whose password matches is the one that logs in; the session then follows that row's
  // NewUser_ID, so role and password stamp always come from the same row.
  const matched = await query(
    `SELECT TOP 1 ${USER_COLUMNS} FROM dbo.[newuser] WHERE user_id = @u AND pass = @p ORDER BY NewUser_ID`,
    { u: id, p: password },
  );
  if (!matched.length) throw invalid;

  const user = toSqlUser(matched[0]);
  await loadShopName();
  cache.set(user.sqlUserId, { user, at: Date.now() });
  return user;
}

// ------------------------------------------------------------------------------------------------
// Per-request lookup (used by `protect`)
// ------------------------------------------------------------------------------------------------

const CACHE_MS = 60_000;
/** How long a signed-in user keeps working on cached data while the shop DB is unreachable. */
const STALE_MAX_MS = 15 * 60_000;
const cache = new Map<number, { user: SqlUser | null; at: number }>();

/** Current state of a Textilesoft user, re-read from SQL at most once a minute. null = user deleted. */
export async function getSqlUser(sqlUserId: number): Promise<SqlUser | null> {
  const hit = cache.get(sqlUserId);
  if (hit && Date.now() - hit.at < CACHE_MS) return hit.user;
  try {
    const rows = await query(
      `SELECT TOP 1 ${USER_COLUMNS} FROM dbo.[newuser] WHERE NewUser_ID = @id`,
      { id: sqlUserId },
    );
    const user = rows.length ? toSqlUser(rows[0]) : null;
    cache.set(sqlUserId, { user, at: Date.now() });
    return user;
  } catch (err) {
    // Shop DB briefly down (e.g. during a restore): keep signed-in users working on the last known state,
    // but not indefinitely -- otherwise a deleted/changed user stays in for the whole outage.
    if (hit && Date.now() - hit.at < STALE_MAX_MS) return hit.user;
    throw err;
  }
}

/** All Textilesoft users (dbo.newuser) in the ERP user shape. Never includes passwords or stamps. */
export async function listSqlUsers() {
  const rows = await query(
    `SELECT ${USER_COLUMNS} FROM dbo.[newuser] ORDER BY NewUser_ID`,
    {},
  );
  await loadShopName();
  const limits = await readDiscountLimits();
  // dbo.newuser has one row per login + counter; list each login once (its first row).
  const seen = new Set<string>();
  const out = [];
  for (const r of rows) {
    const u = toSqlUser(r);
    const key = u.userId.toUpperCase();
    if (seen.has(key)) continue;
    seen.add(key);
    // toErpUser carries no password or stamp.
    out.push({
      ...toErpUser(u),
      active: u.active,
      mode: u.mode,
      maxDiscountPercent: limits.has(key) ? limits.get(key)! : null,
    });
  }
  return out;
}

// ------------------------------------------------------------------------------------------------
// Shop name
// ------------------------------------------------------------------------------------------------

let sqlShopName: string | null = null;
let shopNameAt = 0;

/**
 * SHOP_NAME from .env, else the shop name Textilesoft prints on its bills (Headerfooterentry.header1),
 * else the first company in companydetail. Looked up once an hour; never fails a login.
 */
export async function loadShopName(): Promise<string> {
  const fromEnv = clean(process.env.SHOP_NAME);
  if (fromEnv) return fromEnv;
  if (sqlShopName !== null && Date.now() - shopNameAt < 3_600_000)
    return sqlShopName;
  try {
    const [h] = await query(
      "SELECT TOP 1 header1 FROM dbo.[Headerfooterentry] WHERE NULLIF(LTRIM(RTRIM(header1)), '') IS NOT NULL ORDER BY ID",
      {},
    );
    let name = clean(h?.header1);
    if (!name) {
      const [c] = await query(
        "SELECT TOP 1 cmy_name_eng FROM dbo.[companydetail] WHERE NULLIF(LTRIM(RTRIM(cmy_name_eng)), '') IS NOT NULL",
        {},
      );
      name = clean(c?.cmy_name_eng);
    }
    sqlShopName = name;
    shopNameAt = Date.now();
  } catch {
    // keep whatever we had; the header just shows no name
  }
  return sqlShopName ?? "";
}

/** Cached shop name for synchronous use (toErpUser). */
function shopName(): string {
  return clean(process.env.SHOP_NAME) || sqlShopName || "";
}

/**
 * Startup self-check (AUTH_SOURCE=sql): logs how Textilesoft users map to ERP roles and the shop name,
 * and warns when nobody would get the owner role. Never throws.
 */
export async function logSqlAuthSetup(): Promise<void> {
  if (!isSqlAuth()) return;
  try {
    const tid = shopTenantId();
    info(
      `[sql-auth] Textilesoft users work in configured shop tenant ${tid} ("${shopName() || process.env.SHOP_NAME || "unnamed shop"}")`,
    );
  } catch (err) {
    warn(`[sql-auth] ${(err as Error).message}`);
  }
  try {
    const users = await query(
      "SELECT user_id, rights FROM dbo.[newuser] ORDER BY NewUser_ID",
      {},
    );
    const byRole: Record<ErpRole, Set<string>> = {
      owner: new Set(),
      staff: new Set(),
    };
    for (const r of users)
      byRole[roleFor(clean(r.user_id), clean(r.rights))].add(clean(r.user_id));
    info(
      `[sql-auth] Textilesoft login: owner = ${[...byRole.owner].join(", ") || "nobody"}; staff = ${[...byRole.staff].join(", ") || "nobody"}`,
    );
    if (!byRole.owner.size) {
      warn(
        `[sql-auth] No Textilesoft user gets the ERP owner role. List the owner user IDs in TEXTILESOFT_OWNER_USERS in .env.`,
      );
    }
    info(
      `[sql-auth] Shop name: "${await loadShopName()}"${clean(process.env.SHOP_NAME) ? " (SHOP_NAME)" : " (from Textilesoft bill header)"}`,
    );
  } catch (err) {
    warn(`[sql-auth] startup check skipped - ${(err as Error).message}`);
  }
}

// ------------------------------------------------------------------------------------------------
// Identity used inside the ERP
// ------------------------------------------------------------------------------------------------

/**
 * Stable ObjectId for a Textilesoft user, so createdBy/userId fields in ERP records keep working.
 * "ffffffff" prefix (timestamp year 2106) can never collide with a real MongoDB id.
 */
export function erpIdForSqlUser(sqlUserId: number): string {
  return "ffffffff" + sqlUserId.toString(16).padStart(16, "0");
}

/** Shop tenant every Textilesoft user belongs to (the ERP's existing shop tenant). */
export function shopTenantId(
  env: NodeJS.ProcessEnv = process.env,
): string {
  const raw = clean(env.SHOP_TENANT_ID);
  if (!/^[a-f\d]{24}$/i.test(raw)) {
    throw new SqlAuthError(
      "SHOP_TENANT_ID is not set in the backend .env, so Textilesoft users can't be linked to the shop.",
      500,
      "AUTH_TENANT_NOT_CONFIGURED",
    );
  }
  return raw;
}

/** Plain user object shaped like the ERP's IUser (what controllers read from req.user). */
export function toErpUser(u: SqlUser) {
  return {
    _id: erpIdForSqlUser(u.sqlUserId),
    id: erpIdForSqlUser(u.sqlUserId),
    name: u.name,
    email: "",
    username: u.userId,
    role: u.role,
    tenantId: shopTenantId(),
    shopName: shopName(),
    status: "active",
    authSource: "sql" as const,
    sqlUserId: u.sqlUserId,
    rights: u.rights,
    counterName: u.counterName,
  };
}

export function generateSqlToken(u: SqlUser): string {
  return jwt.sign(
    {
      id: erpIdForSqlUser(u.sqlUserId),
      src: "sql",
      sqlUserId: u.sqlUserId,
      pwv: u.pwStamp,
      jti: crypto.randomBytes(16).toString("hex"),
    },
    process.env.JWT_SECRET as string,
    { expiresIn: "7d" },
  );
}

/**
 * True when a token's password stamp still matches the user's current password in Textilesoft.
 * Tokens issued before stamps existed (no `pwv`) are treated as stale, so users log in once more.
 */
export function tokenMatchesPassword(pwv: unknown, u: SqlUser): boolean {
  if (typeof pwv !== "string" || pwv.length !== u.pwStamp.length) return false;
  return crypto.timingSafeEqual(Buffer.from(pwv), Buffer.from(u.pwStamp));
}

/** For tests. */
export function clearSqlUserCache(): void {
  cache.clear();
  sqlShopName = null;
  shopNameAt = 0;
}
