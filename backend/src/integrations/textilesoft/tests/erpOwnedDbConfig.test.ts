import { loadErpOwnedDbConfig } from "../erpOwnedDbConfig.js";

const baseEnv: NodeJS.ProcessEnv = {
  TEXTILESOFT_DB_HOST: "sql.example.test",
  TEXTILESOFT_DB_NAME: "SSS",
  TEXTILESOFT_DB_USER: "shop-reader",
  TEXTILESOFT_DB_PASSWORD: "shop-secret",
  ERP_SQL_DB_NAME: "ERPData",
  ERP_SQL_DB_USER: "erp-app",
  ERP_SQL_DB_PASSWORD: "erp-secret",
};

describe("loadErpOwnedDbConfig", () => {
  it("uses the dedicated database credentials and preserves the shared server settings", () => {
    expect(loadErpOwnedDbConfig(baseEnv)).toMatchObject({
      server: "sql.example.test",
      database: "ERPData",
      user: "erp-app",
      password: "erp-secret",
    });
  });

  it("requires an explicit ERP database name", () => {
    const env = { ...baseEnv, ERP_SQL_DB_NAME: " " };
    expect(() => loadErpOwnedDbConfig(env)).toThrow("ERP_SQL_DB_NAME");
  });

  it("rejects the SSS database regardless of letter case", () => {
    const env = { ...baseEnv, ERP_SQL_DB_NAME: "sss" };
    expect(() => loadErpOwnedDbConfig(env)).toThrow("must not be the Textilesoft SSS database");
  });

  it("requires a dedicated SQL login", () => {
    const env = { ...baseEnv, ERP_SQL_DB_PASSWORD: "" };
    expect(() => loadErpOwnedDbConfig(env)).toThrow("ERP_SQL_DB_USER and ERP_SQL_DB_PASSWORD");
  });

});
