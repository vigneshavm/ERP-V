export type AppDataMode = "sql-only";

export function getAppDataMode(
  env: NodeJS.ProcessEnv = process.env,
): AppDataMode {
  const value = (env.APP_DATA_MODE ?? "sql-only").trim().toLowerCase();
  if (value === "sql-only") return "sql-only";
  throw new Error(`Invalid APP_DATA_MODE "${env.APP_DATA_MODE}"; this build supports sql-only mode`);
}

export const isSqlOnlyMode = (): boolean =>
  getAppDataMode() === "sql-only";
