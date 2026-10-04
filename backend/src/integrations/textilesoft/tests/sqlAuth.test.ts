import { describe, it, expect, jest, beforeEach } from "@jest/globals";

// Fake dbo.newuser. The password check mimics SQL Server's default case-insensitive collation.
type Row = Record<string, unknown>;
let rows: Row[] = [];
let failQueries = false;
let headerRows: Row[] = [];
const groupRows = () => {
  const m = new Map<
    string,
    { rights: string; users: number; active: number }
  >();
  for (const r of rows) {
    const k = String(r.rights ?? "").trim();
    const g = m.get(k) ?? { rights: k, users: 0, active: 0 };
    g.users++;
    if (String(r.active).trim() === "1") g.active++;
    m.set(k, g);
  }
  return [...m.values()];
};
const logs: string[] = [];
let tenantDoc: Record<string, unknown> | null = {
  name: "vijayalakshmi",
  shopName: "Sri Vijayalakshmi",
};
jest.unstable_mockModule("../../../modules/core/models/Tenant.js", () => ({
  default: {
    findById: () => ({ select: () => ({ lean: async () => tenantDoc }) }),
  },
}));
jest.unstable_mockModule("../../../config/logger.js", () => ({
  info: (m: string) => logs.push("INFO " + m),
  warn: (m: string) => logs.push("WARN " + m),
}));
const queries: { text: string; params: Record<string, unknown> }[] = [];

const eq = (a: unknown, b: unknown) =>
  String(a ?? "")
    .trimEnd()
    .toLowerCase() ===
  String(b ?? "")
    .trimEnd()
    .toLowerCase();

jest.unstable_mockModule("../shopDbPool.js", () => ({
  getShopPool: async () => ({
    request() {
      const params: Record<string, unknown> = {};
      return {
        input: (k: string, v: unknown) => {
          params[k] = v;
        },
        query: async (text: string) => {
          queries.push({ text, params: { ...params } });
          if (failQueries) throw new Error("connection lost");
          if (/Headerfooterentry/.test(text)) return { recordset: headerRows };
          if (/companydetail/.test(text)) return { recordset: [] };
          if (/GROUP BY/.test(text)) return { recordset: groupRows() };
          let rs = rows;
          if ("id" in params) rs = rs.filter((r) => r.NewUser_ID === params.id);
          if ("u" in params) rs = rs.filter((r) => eq(r.user_id, params.u));
          if ("p" in params) rs = rs.filter((r) => eq(r.pass, params.p));
          return { recordset: rs };
        },
      };
    },
  }),
}));

const auth = await import("../sqlAuth.js");

const TENANT = "6990b6cfc5b06f43a8a0ee71";

beforeEach(() => {
  process.env.SHOP_TENANT_ID = TENANT;
  process.env.JWT_SECRET = "test-secret";
  delete process.env.TEXTILESOFT_OWNER_RIGHTS;
  delete process.env.TEXTILESOFT_OWNER_USERS;
  delete process.env.AUTH_SOURCE;
  delete process.env.SHOP_NAME;
  headerRows = [{ header1: "  SRI VIJAYALAKSHMI TEX  " }];
  logs.length = 0;
  failQueries = false;
  queries.length = 0;
  auth.clearSqlUserCache();
  rows = [
    {
      NewUser_ID: 1,
      name: "Owner",
      user_id: "boss",
      pass: "Secret1",
      rights: "Admin",
      counter_name: "SERVER",
      mode: "A",
      active: "1",
    },
    {
      NewUser_ID: 7,
      name: "Cashier",
      user_id: "cash1",
      pass: "1234",
      rights: "User",
      counter_name: "C1",
      mode: "B",
      active: "1",
    },
    {
      NewUser_ID: 9,
      name: "Old",
      user_id: "old",
      pass: "x",
      rights: "User",
      counter_name: "C1",
      mode: "C",
      active: "0",
    },
  ];
});

describe("verifySqlLogin (Textilesoft dbo.newuser)", () => {
  it("logs in with user ID + password and maps Admin rights to owner", async () => {
    const u = await auth.verifySqlLogin(" boss ", "Secret1");
    expect(u).toMatchObject({
      sqlUserId: 1,
      userId: "boss",
      name: "Owner",
      role: "owner",
      counterName: "SERVER",
      active: true,
    });
  });

  it("password check is done by SQL (parameterised), like Textilesoft", async () => {
    await auth.verifySqlLogin("cash1", "1234");
    const pw = queries.find((q) => "p" in q.params)!;
    expect(pw.text).toMatch(/user_id = @u AND pass = @p/);
    expect(pw.params).toEqual({ u: "cash1", p: "1234" });
  });

  it("non-admin rights get staff", async () => {
    expect((await auth.verifySqlLogin("cash1", "1234")).role).toBe("staff");
  });

  it("owner rights are configurable", async () => {
    process.env.TEXTILESOFT_OWNER_RIGHTS = "admin, user";
    expect((await auth.verifySqlLogin("cash1", "1234")).role).toBe("owner");
  });

  it("rejects unknown user and wrong password with the same message", async () => {
    await expect(auth.verifySqlLogin("nobody", "1234")).rejects.toMatchObject({
      statusCode: 401,
      message: "Invalid user ID or password",
    });
    await expect(auth.verifySqlLogin("cash1", "wrong")).rejects.toMatchObject({
      statusCode: 401,
      message: "Invalid user ID or password",
    });
  });

  it("unknown user and wrong password each take exactly one query (no timing difference)", async () => {
    await expect(auth.verifySqlLogin("nobody", "1234")).rejects.toThrow();
    const unknownUser = queries.length;
    queries.length = 0;
    await expect(auth.verifySqlLogin("cash1", "wrong")).rejects.toThrow();
    expect(unknownUser).toBe(1);
    expect(queries).toHaveLength(1);
    expect(queries[0].text).toMatch(/user_id = @u AND pass = @p/);
  });

  it("duplicate user_id rows: the row whose password matches is the one that logs in", async () => {
    rows.push(
      { NewUser_ID: 20, name: "Dup A", user_id: "dup", pass: "aaa", rights: "User", active: "0" },
      { NewUser_ID: 21, name: "Dup B", user_id: "dup", pass: "bbb", rights: "Admin", active: "0" },
    );
    const b = await auth.verifySqlLogin("dup", "bbb");
    expect(b).toMatchObject({ sqlUserId: 21, role: "owner" });
    expect((await auth.verifySqlLogin("dup", "aaa")).sqlUserId).toBe(20);
  });

  it("does not block active = '0' (Textilesoft doesn't; every shop user has it)", async () => {
    expect((await auth.verifySqlLogin("old", "x")).userId).toBe("old");
  });

  it("owner by user ID (TEXTILESOFT_OWNER_USERS), case-insensitive", async () => {
    process.env.TEXTILESOFT_OWNER_USERS = "ADMIN, Cash1";
    expect((await auth.verifySqlLogin("cash1", "1234")).role).toBe("owner");
    expect((await auth.verifySqlLogin("old", "x")).role).toBe("staff");
  });

  it("rejects empty input without querying", async () => {
    await expect(auth.verifySqlLogin("", "")).rejects.toMatchObject({
      statusCode: 400,
    });
    expect(queries).toHaveLength(0);
  });

  it("reports 503 when the shop database is down", async () => {
    failQueries = true;
    await expect(auth.verifySqlLogin("cash1", "1234")).rejects.toMatchObject({
      statusCode: 503,
    });
  });
});

describe("session helpers", () => {
  it("maps a Textilesoft user to a stable ERP id in the shop tenant", async () => {
    const u = await auth.verifySqlLogin("cash1", "1234");
    const erp = auth.toErpUser(u);
    expect(erp._id.toString()).toBe("ffffffff0000000000000007");
    expect(erp._id.toString()).toBe(auth.toErpUser(u)._id.toString());
    expect(erp.tenantId.toString()).toBe(TENANT);
    expect(erp).toMatchObject({
      role: "staff",
      authSource: "sql",
      username: "cash1",
    });
  });

  it("needs SHOP_TENANT_ID", async () => {
    const u = await auth.verifySqlLogin("cash1", "1234");
    delete process.env.SHOP_TENANT_ID;
    expect(() => auth.toErpUser(u)).toThrow(/SHOP_TENANT_ID/);
  });

  it("getSqlUser re-reads after the cache expires, and survives a DB outage on cached data", async () => {
    const first = await auth.getSqlUser(7);
    expect(first?.active).toBe(true);
    failQueries = true;
    expect((await auth.getSqlUser(7))?.active).toBe(true); // cached
    auth.clearSqlUserCache();
    await expect(auth.getSqlUser(7)).rejects.toMatchObject({ statusCode: 503 });
    failQueries = false;
    rows[1].name = "Renamed";
    expect((await auth.getSqlUser(7))?.name).toBe("Renamed");
    expect(await auth.getSqlUser(999)).toBeNull();
  });

  it("stops serving cached data after a long shop DB outage", async () => {
    const now = jest.spyOn(Date, "now");
    const t0 = 1_000_000_000_000;
    now.mockReturnValue(t0);
    await auth.getSqlUser(7);
    failQueries = true;
    now.mockReturnValue(t0 + 5 * 60_000); // 5 min: cache expired, DB down -> last known state
    expect((await auth.getSqlUser(7))?.userId).toBe("cash1");
    now.mockReturnValue(t0 + 16 * 60_000); // past the 15 min limit -> fail
    await expect(auth.getSqlUser(7)).rejects.toMatchObject({ statusCode: 503 });
    now.mockRestore();
  });

  it("password stamp: token stays valid until the password is changed in Textilesoft", async () => {
    const jwt = (await import("jsonwebtoken")).default;
    const u = await auth.verifySqlLogin("cash1", "1234");
    const decoded = jwt.verify(auth.generateSqlToken(u), "test-secret") as Record<string, unknown>;
    expect(decoded.pwv).toBe(u.pwStamp);
    expect(JSON.stringify(decoded)).not.toContain("1234");
    expect(JSON.stringify(auth.toErpUser(u))).not.toContain(u.pwStamp);

    auth.clearSqlUserCache();
    expect(auth.tokenMatchesPassword(decoded.pwv, (await auth.getSqlUser(7))!)).toBe(true);

    rows[1].pass = "9999"; // changed in Textilesoft
    auth.clearSqlUserCache(); // (in production: after at most CACHE_MS)
    expect(auth.tokenMatchesPassword(decoded.pwv, (await auth.getSqlUser(7))!)).toBe(false);
  });

  it("tokens without a password stamp (issued before this change) are not accepted", async () => {
    const u = await auth.verifySqlLogin("cash1", "1234");
    expect(auth.tokenMatchesPassword(undefined, u)).toBe(false);
    expect(auth.tokenMatchesPassword("short", u)).toBe(false);
  });

  it("password stamp depends on JWT_SECRET (can't be brute-forced from the token alone)", () => {
    const a = auth.passwordStamp(7, "1234");
    process.env.JWT_SECRET = "other-secret";
    expect(auth.passwordStamp(7, "1234")).not.toBe(a);
  });

  it("AUTH_SOURCE defaults to sql", () => {
    expect(auth.isSqlAuth()).toBe(true);
    process.env.AUTH_SOURCE = "mongo";
    expect(auth.isSqlAuth()).toBe(false);
  });

  it("token carries the SQL user", async () => {
    const jwt = (await import("jsonwebtoken")).default;
    const u = await auth.verifySqlLogin("boss", "Secret1");
    const decoded = jwt.verify(
      auth.generateSqlToken(u),
      "test-secret",
    ) as Record<string, unknown>;
    expect(decoded).toMatchObject({
      src: "sql",
      sqlUserId: 1,
      id: "ffffffff0000000000000001",
    });
  });
});

describe("shop name + startup check", () => {
  it("uses the Textilesoft bill header when SHOP_NAME is empty", async () => {
    const u = await auth.verifySqlLogin("cash1", "1234");
    expect(auth.toErpUser(u).shopName).toBe("SRI VIJAYALAKSHMI TEX");
  });

  it("SHOP_NAME in .env wins", async () => {
    process.env.SHOP_NAME = "My Shop";
    const u = await auth.verifySqlLogin("cash1", "1234");
    expect(auth.toErpUser(u).shopName).toBe("My Shop");
  });

  it("logs who is owner / staff and the shop name", async () => {
    await auth.logSqlAuthSetup();
    const all = logs.join("\n");
    expect(all).toMatch(/owner = boss; staff = cash1, old/);
    expect(all).toMatch(/Shop name: "SRI VIJAYALAKSHMI TEX"/);
    expect(all).toMatch(
      /configured shop tenant 6990b6cfc5b06f43a8a0ee71/,
    );
    expect(all).not.toMatch(/No Textilesoft user gets the ERP owner role/);
  });

  it("warns when nobody would be owner", async () => {
    process.env.TEXTILESOFT_OWNER_RIGHTS = "manager";
    await auth.logSqlAuthSetup();
    expect(logs.join("\n")).toMatch(
      /WARN .*No Textilesoft user gets the ERP owner role/,
    );
  });

  it("never throws when the shop DB is down", async () => {
    failQueries = true;
    await expect(auth.logSqlAuthSetup()).resolves.toBeUndefined();
    expect(logs.join("\n")).toMatch(/startup check skipped/);
  });
});
