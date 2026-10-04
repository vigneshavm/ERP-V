/**
 * Applies pending backend/sql/erp/*.sql migrations to the `erp` schema, in filename order (NNN_name.sql).
 * Runs as TEXTILESOFT_ADMIN_USER (needs rights to CREATE SCHEMA/TABLE); the app's normal read/write
 * logins never run DDL. Idempotent: each file's checksum is recorded in erp.schema_migrations, and a
 * file that already ran (by version number) is skipped even if its content changed (edit the DB by hand
 * or add a new migration instead of editing an applied one).
 *
 * Usage: npm run erp:migrate   (backend/.env must have TEXTILESOFT_DB_* + TEXTILESOFT_ADMIN_USER/PASSWORD)
 */
import "dotenv/config";
import { createHash } from "crypto";
import { readFileSync, readdirSync } from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { loadDbConfig } from "../integrations/textilesoft/shopDbReader.js";
import { info, warn, error as logError } from "../config/logger.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const MIGRATIONS_DIR = path.resolve(__dirname, "../../sql/erp");

interface Migration {
  version: number;
  name: string;
  file: string;
  sql: string;
  checksum: string;
}

function loadMigrations(): Migration[] {
  const files = readdirSync(MIGRATIONS_DIR).filter((f) => f.endsWith(".sql"));
  const migrations: Migration[] = [];
  for (const file of files) {
    const match = /^(\d+)_(.+)\.sql$/.exec(file);
    if (!match) {
      warn(`[erp-migrate] skipping ${file}: name must be NNN_description.sql`);
      continue;
    }
    const sql = readFileSync(path.join(MIGRATIONS_DIR, file), "utf8");
    migrations.push({
      version: Number(match[1]),
      name: match[2],
      file,
      sql,
      checksum: createHash("sha256").update(sql).digest("hex"),
    });
  }
  return migrations.sort((a, b) => a.version - b.version);
}

/** mssql has no native "GO" batch separator; split on lines that are exactly GO (SSMS convention). */
function splitBatches(sql: string): string[] {
  return sql
    .split(/^\s*GO\s*$/im)
    .map((b) => b.trim())
    .filter(Boolean);
}

async function main(): Promise<void> {
  const cfg = loadDbConfig();
  if (!process.env.TEXTILESOFT_ADMIN_USER || !process.env.TEXTILESOFT_ADMIN_PASSWORD) {
    throw new Error(
      "TEXTILESOFT_ADMIN_USER / TEXTILESOFT_ADMIN_PASSWORD must be set to run erp migrations.",
    );
  }
  const mssql = (await import("mssql")).default;
  const pool = new mssql.ConnectionPool({
    server: cfg.server,
    port: cfg.instanceName ? undefined : cfg.port,
    database: cfg.database,
    user: process.env.TEXTILESOFT_ADMIN_USER,
    password: process.env.TEXTILESOFT_ADMIN_PASSWORD,
    connectionTimeout: cfg.connectionTimeoutMs,
    requestTimeout: 60000,
    options: {
      instanceName: cfg.instanceName,
      encrypt: cfg.encrypt,
      trustServerCertificate: cfg.trustServerCertificate,
    },
  });
  await pool.connect();
  try {
    const migrations = loadMigrations();
    // Bootstrap: erp schema + schema_migrations table must exist before we can query them.
    for (const batch of splitBatches(migrations[0]?.sql ?? "")) {
      await pool.request().batch(batch);
    }
    const appliedRows = await pool
      .request()
      .query("SELECT version FROM erp.schema_migrations");
    const applied = new Set<number>(
      appliedRows.recordset.map((r: { version: number }) => r.version),
    );
    if (!applied.has(migrations[0].version)) {
      await pool
        .request()
        .input("version", migrations[0].version)
        .input("name", migrations[0].name)
        .input("checksum", migrations[0].checksum)
        .query(
          "INSERT INTO erp.schema_migrations (version, name, checksum) VALUES (@version, @name, @checksum)",
        );
      applied.add(migrations[0].version);
      info(`[erp-migrate] applied ${migrations[0].file}`);
    }

    for (const m of migrations.slice(1)) {
      if (applied.has(m.version)) continue;
      for (const batch of splitBatches(m.sql)) {
        await pool.request().batch(batch);
      }
      await pool
        .request()
        .input("version", m.version)
        .input("name", m.name)
        .input("checksum", m.checksum)
        .query(
          "INSERT INTO erp.schema_migrations (version, name, checksum) VALUES (@version, @name, @checksum)",
        );
      info(`[erp-migrate] applied ${m.file}`);
    }
    info("[erp-migrate] up to date");
  } finally {
    await pool.close();
  }
}

main().catch((err) => {
  logError("[erp-migrate] failed", { error: (err as Error).message });
  process.exit(1);
});
