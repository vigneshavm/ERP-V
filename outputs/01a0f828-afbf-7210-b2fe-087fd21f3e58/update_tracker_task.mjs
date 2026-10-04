import { FileBlob, SpreadsheetFile } from "@oai/artifact-tool";

const workbookPath = "C:/Users/avmvi/Project/ERP/outputs/01a0f828-afbf-7210-b2fe-087fd21f3e58/Mongo_Free_SQL_Migration_Tracker.xlsx";
const [taskId, status, completedDate = "", evidence = ""] = process.argv.slice(2);
if (!taskId || !["Not Started", "In Progress", "Blocked", "Done"].includes(status)) {
  throw new Error("Usage: node update_tracker_task.mjs <SQL-###> <status> [yyyy-mm-dd] [evidence]");
}

const workbook = await SpreadsheetFile.importXlsx(await FileBlob.load(workbookPath));
const taskSheet = workbook.worksheets.getItem("Tasks");
const used = taskSheet.getUsedRange();
const values = used.values;
const index = values.findIndex((row) => row[0] === taskId);
if (index < 1) throw new Error(`Task ${taskId} was not found in the tracker.`);
const rowNumber = index + 1;
taskSheet.getRange(`G${rowNumber}`).values = [[status]];
if (completedDate && completedDate !== "-") {
  const [year, month, day] = completedDate.split("-").map(Number);
  taskSheet.getRange(`J${rowNumber}`).values = [[new Date(year, month - 1, day)]];
}
if (evidence) taskSheet.getRange(`K${rowNumber}`).values = [[evidence]];

workbook.recalculate();
const rowCheck = await workbook.inspect({
  kind: "table",
  range: `A${rowNumber}:K${rowNumber}`,
  include: "values",
  tableMaxRows: 1,
  tableMaxCols: 11,
  tableMaxCellChars: 220,
});
const summaryCheck = await workbook.inspect({
  kind: "table",
  range: "Overview!A7:B14",
  include: "values,formulas",
  tableMaxRows: 8,
  tableMaxCols: 2,
});
console.log(rowCheck.ndjson);
console.log(summaryCheck.ndjson);
const output = await SpreadsheetFile.exportXlsx(workbook);
await output.save(workbookPath);
console.log(`Updated ${taskId} in ${workbookPath}`);
