import "dotenv/config";
import { info } from "../config/logger.js";
import { loadDbConfig, openPool, queryAll } from "../integrations/textilesoft/shopDbReader.js";

async function main(): Promise<void> {
  const pool = await openPool(loadDbConfig());
  try {
    const summary = await queryAll(
      pool,
      `SET TRANSACTION ISOLATION LEVEL READ UNCOMMITTED;
       SELECT COUNT_BIG(*) AS totalRows,
              COUNT_BIG([sl_nu]) AS nonNullKeys,
              COUNT_BIG(DISTINCT [sl_nu]) AS distinctKeys,
              (SELECT COUNT_BIG(*) FROM (
                 SELECT [sl_nu] FROM [dbo].[newcustomer]
                 WHERE [sl_nu] IS NOT NULL GROUP BY [sl_nu] HAVING COUNT_BIG(*) > 1
               ) AS duplicateKeys) AS duplicateKeyGroups
       FROM [dbo].[newcustomer];`,
    );
    const columnMetadata = await queryAll(
      pool,
      `SELECT c.name AS columnName, TYPE_NAME(c.user_type_id) AS dataType,
              c.max_length AS maxLength, c.is_nullable AS isNullable,
              c.is_identity AS isIdentity
       FROM sys.columns AS c
       WHERE c.object_id = OBJECT_ID(N'dbo.newcustomer') AND c.name = N'sl_nu';`,
    );
    const indexMetadata = await queryAll(
      pool,
      `SELECT i.name AS indexName, i.is_primary_key AS isPrimaryKey,
              i.is_unique AS isUnique, ic.key_ordinal AS keyOrdinal,
              c.name AS columnName
       FROM sys.indexes AS i
       JOIN sys.index_columns AS ic ON ic.object_id = i.object_id AND ic.index_id = i.index_id
       JOIN sys.columns AS c ON c.object_id = ic.object_id AND c.column_id = ic.column_id
       WHERE i.object_id = OBJECT_ID(N'dbo.newcustomer') AND c.name = N'sl_nu'
       ORDER BY i.index_id, ic.key_ordinal;`,
    );
    const triggers = await queryAll(
      pool,
      `SELECT tr.name AS triggerName, OBJECT_DEFINITION(tr.object_id) AS definition
       FROM sys.triggers AS tr
       WHERE tr.parent_id = OBJECT_ID(N'dbo.newcustomer');`,
    );
    const defaults = await queryAll(
      pool,
      `SELECT dc.name AS defaultName, dc.definition AS definition
       FROM sys.default_constraints AS dc
       JOIN sys.columns AS c ON c.object_id = dc.parent_object_id
                            AND c.column_id = dc.parent_column_id
       WHERE dc.parent_object_id = OBJECT_ID(N'dbo.newcustomer') AND c.name = N'sl_nu';`,
    );
    const allocationReferences = await queryAll(
      pool,
      `SELECT s.name AS schemaName, o.name AS objectName, o.type_desc AS objectType,
              m.definition AS definition
       FROM sys.sql_modules AS m
       JOIN sys.objects AS o ON o.object_id = m.object_id
       JOIN sys.schemas AS s ON s.schema_id = o.schema_id
       WHERE m.definition LIKE N'%newcustomer%'
          OR m.definition LIKE N'%sl_nu%'
       ORDER BY s.name, o.name;`,
    );

    info("Customer-key aggregate check (no customer values):");
    info(JSON.stringify(summary));
    info("Key column, indexes, trigger, and default metadata:");
    for (const row of [...columnMetadata, ...indexMetadata, ...triggers, ...defaults])
      info(JSON.stringify(row));
    info(`SQL modules referencing customer table/key: ${allocationReferences.length}`);
    for (const row of allocationReferences) {
      info(JSON.stringify({
        schemaName: row.schemaName,
        objectName: row.objectName,
        objectType: row.objectType,
        definition: row.definition,
      }));
    }
  } finally {
    await pool.close();
  }
}

main().catch((error: unknown) => {
  process.stderr.write(`Customer key audit failed: ${error instanceof Error ? error.message : String(error)}\n`);
  process.exitCode = 1;
});
