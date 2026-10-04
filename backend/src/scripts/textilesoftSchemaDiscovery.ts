/* eslint-disable no-console */
import fs from "fs";
import path from "path";
import dotenv from "dotenv";
import { loadDbConfig } from "../integrations/textilesoft/shopDbReader.js";
import {
  getAdminDbConfig,
  verifyBackupHeader,
  restoreDatabaseFromFile,
} from "../integrations/textilesoft/sqlRestoreService.js";
import {
  CONCEPTS,
  probeConcepts,
  renderConceptsMd,
  renderSchemaMd,
  type SchemaSnapshot,
} from "../integrations/textilesoft/schemaReport.js";

dotenv.config();

/**
 * Restores the Textilesoft backup (.BAK) and writes a full schema report of it.
 *
 *   npx tsx src/scripts/textilesoftSchemaDiscovery.ts [options]
 *
 *   --bak=<path>            backup file (default: ../SRISYSSSS_2026_1_3_11_46.BAK)
 *   --db=<name>             database to restore into and read (default: SSS_schema_probe, a scratch copy;
 *                           the schema is identical to SSS_copy and no real data is touched)
 *   --copy-bak              copy the .BAK into TEXTILESOFT_BACKUP_DIR first (SQL Server's service account
 *                           often cannot read files under C:\Users\...)
 *   --skip-restore          do not restore; just read the database named by --db (default: TEXTILESOFT_DB_NAME)
 *   --drop-after            drop the scratch database when finished (only ever a database this run restored)
 *   --confirm-overwrite     required when --db is the ERP's own database (e.g. SSS_copy). That path uses the
 *                           app's restore-with-carryover, which keeps newer local bills.
 *
 * Output: textilesoft-discovery/schema-<db>/{schema.json, SCHEMA.md, CONCEPTS.md}. Contains table/column
 * names and approximate row counts only - no row data.
 */

type Row = Record<string, any>; // eslint-disable-line @typescript-eslint/no-explicit-any

function parseArgs(argv: string[]): Record<string, string | true> {
  const out: Record<string, string | true> = {};
  for (const a of argv) {
    const m = /^--([^=]+)(?:=(.*))?$/.exec(a);
    if (m) out[m[1]] = m[2] === undefined ? true : m[2];
  }
  return out;
}

const SAFE_DB = /^[A-Za-z0-9_]+$/;
const lit = (s: string) => s.replace(/'/g, "''");

async function connect(database: string, requestTimeout: number) {
  const cfg = getAdminDbConfig();
  const mssql = (await import("mssql")).default;
  const pool = new mssql.ConnectionPool({
    server: cfg.server,
    port: cfg.instanceName ? undefined : cfg.port,
    database,
    user: cfg.user,
    password: cfg.password,
    connectionTimeout: cfg.connectionTimeoutMs,
    requestTimeout,
    options: {
      instanceName: cfg.instanceName,
      encrypt: cfg.encrypt,
      trustServerCertificate: cfg.trustServerCertificate,
    },
  });
  await pool.connect();
  return pool;
}

async function rawRestore(bak: string, db: string): Promise<void> {
  const pool = await connect("master", 0);
  try {
    const files = (await pool.request().query(`RESTORE FILELISTONLY FROM DISK = N'${lit(bak)}'`)).recordset as Row[];
    if (!files.length) throw new Error("RESTORE FILELISTONLY returned no files - is this a valid SQL Server backup?");

    const dirs = (
      await pool.request().query(
        `SELECT CAST(SERVERPROPERTY('InstanceDefaultDataPath') AS NVARCHAR(4000)) AS d,
                CAST(SERVERPROPERTY('InstanceDefaultLogPath') AS NVARCHAR(4000)) AS l,
                (SELECT TOP 1 physical_name FROM sys.master_files WHERE database_id = 1 AND file_id = 1) AS masterFile`,
      )
    ).recordset[0] as Row;
    const fallbackDir = String(dirs.masterFile ?? "").replace(/[^\\/]+$/, "");
    const withSlash = (p: string) => (/[\\/]$/.test(p) ? p : p + "\\");
    const dataDir = withSlash(String(dirs.d || fallbackDir));
    const logDir = withSlash(String(dirs.l || dirs.d || fallbackDir));
    if (dataDir === "\\") throw new Error("Could not determine the SQL Server data folder to restore into.");

    let dataIndex = 0;
    const moves = files
      .map((f) => {
        const logical = String(f.LogicalName);
        const type = String(f.Type);
        const safe = logical.replace(/[^A-Za-z0-9_.-]/g, "_");
        let target: string;
        if (type === "L") target = `${logDir}${db}_${safe}.ldf`;
        else if (type === "D") target = `${dataDir}${db}_${safe}${dataIndex++ === 0 ? ".mdf" : ".ndf"}`;
        else target = `${dataDir}${db}_${safe}.dat`;
        return `MOVE N'${lit(logical)}' TO N'${lit(target)}'`;
      })
      .join(",\n  ");

    console.log(`Restoring into [${db}] (${files.length} file(s)) ... this can take several minutes.`);
    const req = pool.request();
    req.on("info", (m: { message: string }) => console.log("  " + m.message));
    await req.query(
      `IF DB_ID(N'${db}') IS NOT NULL ALTER DATABASE [${db}] SET SINGLE_USER WITH ROLLBACK IMMEDIATE;
       RESTORE DATABASE [${db}] FROM DISK = N'${lit(bak)}' WITH
         ${moves},
         REPLACE, STATS = 10;
       ALTER DATABASE [${db}] SET MULTI_USER;`,
    );
  } finally {
    await pool.close();
  }
}

async function readSnapshot(db: string, bak?: string): Promise<SchemaSnapshot> {
  const pool = await connect(db, 120000);
  const q = async (sql: string): Promise<Row[]> => (await pool.request().query(sql)).recordset as Row[];
  try {
    const info = (
      await q(`SELECT @@VERSION AS version, d.collation_name AS collation, d.compatibility_level AS compat, d.recovery_model_desc AS recovery
               FROM sys.databases d WHERE d.name = DB_NAME()`)
    )[0];

    const schemas = (
      await q(`SELECT name FROM sys.schemas
               WHERE name NOT IN ('sys','INFORMATION_SCHEMA','guest') AND name NOT LIKE 'db[_]%' ORDER BY name`)
    ).map((r) => String(r.name));

    const tables = (
      await q(`SELECT s.name AS [schema], t.name AS [table], t.create_date, t.modify_date,
                 SUM(CASE WHEN p.index_id IN (0,1) THEN p.rows ELSE 0 END) AS [rows],
                 OBJECTPROPERTY(t.object_id,'TableHasIdentity') AS has_identity,
                 OBJECTPROPERTY(t.object_id,'TableHasPrimaryKey') AS has_pk
               FROM sys.tables t
               JOIN sys.schemas s ON s.schema_id = t.schema_id
               LEFT JOIN sys.partitions p ON p.object_id = t.object_id
               WHERE t.is_ms_shipped = 0
               GROUP BY s.name, t.name, t.object_id, t.create_date, t.modify_date`)
    ).map((r) => ({
      schema: String(r.schema),
      table: String(r.table),
      rows: Number(r.rows ?? 0),
      hasIdentity: r.has_identity === 1,
      hasPk: r.has_pk === 1,
      createDate: r.create_date ? new Date(r.create_date).toISOString() : undefined,
      modifyDate: r.modify_date ? new Date(r.modify_date).toISOString() : undefined,
    }));

    const columns = (
      await q(`SELECT s.name AS [schema], t.name AS [table], c.name AS [name], ty.name AS [type],
                 c.max_length, c.precision, c.scale, c.is_nullable, c.is_identity, c.is_computed, dc.definition AS [default]
               FROM sys.columns c
               JOIN sys.tables t ON t.object_id = c.object_id
               JOIN sys.schemas s ON s.schema_id = t.schema_id
               JOIN sys.types ty ON ty.user_type_id = c.user_type_id
               LEFT JOIN sys.default_constraints dc ON dc.object_id = c.default_object_id
               WHERE t.is_ms_shipped = 0
               ORDER BY s.name, t.name, c.column_id`)
    ).map((r) => ({
      schema: String(r.schema),
      table: String(r.table),
      name: String(r.name),
      type: String(r.type),
      maxLength: Number(r.max_length),
      precision: Number(r.precision),
      scale: Number(r.scale),
      nullable: !!r.is_nullable,
      identity: !!r.is_identity,
      computed: !!r.is_computed,
      default: r.default ? String(r.default) : null,
    }));

    const indexes = (
      await q(`SELECT s.name AS [schema], t.name AS [table], i.name AS [index], i.type_desc, i.is_unique, i.is_primary_key,
                 STUFF((SELECT ',' + c.name + CASE WHEN ic.is_descending_key = 1 THEN ' DESC' ELSE '' END
                        FROM sys.index_columns ic
                        JOIN sys.columns c ON c.object_id = ic.object_id AND c.column_id = ic.column_id
                        WHERE ic.object_id = i.object_id AND ic.index_id = i.index_id AND ic.is_included_column = 0
                        ORDER BY ic.key_ordinal FOR XML PATH('')), 1, 1, '') AS key_columns
               FROM sys.indexes i
               JOIN sys.tables t ON t.object_id = i.object_id
               JOIN sys.schemas s ON s.schema_id = t.schema_id
               WHERE i.type > 0 AND t.is_ms_shipped = 0`)
    ).map((r) => ({
      schema: String(r.schema),
      table: String(r.table),
      name: String(r.index ?? ""),
      typeDesc: String(r.type_desc),
      unique: !!r.is_unique,
      primaryKey: !!r.is_primary_key,
      keyColumns: String(r.key_columns ?? ""),
    }));

    const foreignKeys = (
      await q(`SELECT fk.name, ps.name AS parent_schema, pt.name AS parent_table, rs.name AS ref_schema, rt.name AS ref_table,
                 STUFF((SELECT ',' + pc.name + '->' + rc.name
                        FROM sys.foreign_key_columns fkc
                        JOIN sys.columns pc ON pc.object_id = fkc.parent_object_id AND pc.column_id = fkc.parent_column_id
                        JOIN sys.columns rc ON rc.object_id = fkc.referenced_object_id AND rc.column_id = fkc.referenced_column_id
                        WHERE fkc.constraint_object_id = fk.object_id
                        ORDER BY fkc.constraint_column_id FOR XML PATH('')), 1, 1, '') AS cols
               FROM sys.foreign_keys fk
               JOIN sys.tables pt ON pt.object_id = fk.parent_object_id
               JOIN sys.schemas ps ON ps.schema_id = pt.schema_id
               JOIN sys.tables rt ON rt.object_id = fk.referenced_object_id
               JOIN sys.schemas rs ON rs.schema_id = rt.schema_id`)
    ).map((r) => ({
      name: String(r.name),
      parentSchema: String(r.parent_schema),
      parentTable: String(r.parent_table),
      refSchema: String(r.ref_schema),
      refTable: String(r.ref_table),
      columns: String(r.cols ?? ""),
    }));

    const objects = (
      await q(`SELECT s.name AS [schema], o.name, o.type_desc, OBJECT_NAME(o.parent_object_id) AS parent, LEN(m.definition) AS def_len
               FROM sys.objects o
               JOIN sys.schemas s ON s.schema_id = o.schema_id
               LEFT JOIN sys.sql_modules m ON m.object_id = o.object_id
               WHERE o.is_ms_shipped = 0 AND o.type IN ('V','P','FN','IF','TF','TR')`)
    ).map((r) => ({
      schema: String(r.schema),
      name: String(r.name),
      typeDesc: String(r.type_desc),
      parent: r.parent ? String(r.parent) : null,
      definitionLength: r.def_len === null || r.def_len === undefined ? null : Number(r.def_len),
    }));

    return {
      generatedAt: new Date().toISOString(),
      database: db,
      version: String(info.version),
      collation: String(info.collation),
      compatibilityLevel: Number(info.compat),
      recoveryModel: String(info.recovery),
      backupFile: bak ? path.basename(bak) : undefined,
      schemas,
      tables,
      columns,
      indexes,
      foreignKeys,
      objects,
    };
  } finally {
    await pool.close();
  }
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const envDb = loadDbConfig().database;
  const db = String(args.db ?? (args["skip-restore"] ? envDb : "SSS_schema_probe"));
  if (!SAFE_DB.test(db)) throw new Error(`Invalid database name '${db}' (letters, digits, underscore only).`);
  const skipRestore = !!args["skip-restore"];
  const isErpDb = db.toLowerCase() === envDb.toLowerCase();
  let bak = path.resolve(String(args.bak ?? path.join(process.cwd(), "..", "SRISYSSSS_2026_1_3_11_46.BAK")));

  let scratchRestored = false;
  if (!skipRestore) {
    if (!fs.existsSync(bak)) throw new Error(`Backup file not found: ${bak}`);
    if (args["copy-bak"]) {
      const dir = getAdminDbConfig().defaultBackupDir;
      fs.mkdirSync(dir, { recursive: true });
      const copy = path.join(dir, path.basename(bak));
      console.log(`Copying backup to ${copy} ...`);
      fs.copyFileSync(bak, copy);
      bak = copy;
    }
    const header = await verifyBackupHeader(bak);
    console.log(`Backup: database '${header.databaseName}', ${header.backupSizeMB} MB, finished ${header.backupFinishDate?.toISOString() ?? "unknown"}`);

    try {
      if (isErpDb) {
        if (!args["confirm-overwrite"])
          throw new Error(
            `--db=${db} is the ERP's own database. Restoring replaces it (newer local bills are carried over). Re-run with --confirm-overwrite, or omit --db to use the scratch copy.`,
          );
        await restoreDatabaseFromFile(bak, { targetDbName: db });
      } else {
        await rawRestore(bak, db);
        scratchRestored = true;
      }
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      if (/Operating system error 5|Access is denied|cannot open backup device/i.test(msg))
        console.error(
          "\nSQL Server could not read the .BAK. Its service account usually cannot open files under C:\\Users\\<you>. " +
            "Re-run with --copy-bak (copies it to TEXTILESOFT_BACKUP_DIR, default C:\\Textilesoft\\Backup) or move the file to a folder SQL Server can read.\n",
        );
      throw e;
    }
  }

  console.log(`Reading schema of [${db}] ...`);
  const snapshot = await readSnapshot(db, skipRestore ? undefined : bak);
  const hits = probeConcepts(snapshot, CONCEPTS);

  const dir = path.resolve(process.cwd(), "textilesoft-discovery", `schema-${db}`);
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(path.join(dir, "schema.json"), JSON.stringify(snapshot, null, 1));
  fs.writeFileSync(path.join(dir, "SCHEMA.md"), renderSchemaMd(snapshot));
  fs.writeFileSync(path.join(dir, "CONCEPTS.md"), renderConceptsMd(snapshot, hits));

  const filled = snapshot.tables.filter((t) => t.rows > 0).length;
  console.log(`\nDone. ${snapshot.tables.length} tables (${filled} with rows), ${snapshot.columns.length} columns, ${snapshot.foreignKeys.length} foreign keys, ${snapshot.objects.length} programmable objects.`);
  console.log(`Existing non-dbo schemas: ${snapshot.schemas.filter((s) => s !== "dbo").join(", ") || "none (no 'erp' schema yet)"}`);
  for (const h of hits) console.log(`  ${h.concept.label.padEnd(44)} ${h.verdict}`);
  console.log(`\nWrote ${dir}\\{schema.json, SCHEMA.md, CONCEPTS.md}`);

  if (args["drop-after"]) {
    if (!scratchRestored) console.log("--drop-after ignored: only a scratch database restored by this run is ever dropped.");
    else {
      const pool = await connect("master", 60000);
      try {
        await pool.request().query(`ALTER DATABASE [${db}] SET SINGLE_USER WITH ROLLBACK IMMEDIATE; DROP DATABASE [${db}];`);
        console.log(`Dropped scratch database [${db}].`);
      } finally {
        await pool.close();
      }
    }
  }
}

main().catch((e) => {
  console.error("Failed:", e instanceof Error ? e.message : e);
  process.exit(1);
});
