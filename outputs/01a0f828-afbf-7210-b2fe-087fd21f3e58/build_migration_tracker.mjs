import fs from "node:fs/promises";
import path from "node:path";
import { SpreadsheetFile, Workbook } from "@oai/artifact-tool";

const root = "C:/Users/avmvi/Project/ERP";
const outputDir = path.join(root, "outputs/01a0f828-afbf-7210-b2fe-087fd21f3e58");
const taskFile = path.join(root, "docs/MONGO_FREE_SQL_MIGRATION_TASKS.md");
const text = await fs.readFile(taskFile, "utf8");
const lines = text.split(/\r?\n/);

let phase = "";
let workPackage = "";
let includeTasks = false;
const tasks = [];
const groupDetails = new Map();
for (const line of lines) {
  const h2 = line.match(/^## (.+)$/);
  if (h2) {
    phase = h2[1];
    includeTasks = phase.startsWith("0.") || /^\d+\./.test(phase);
    workPackage = phase;
    continue;
  }
  const h3 = line.match(/^### (.+)$/);
  if (h3 && includeTasks) {
    workPackage = h3[1];
    groupDetails.set(workPackage, { acceptance: "", dependencies: "" });
    continue;
  }
  if (!includeTasks) continue;
  const item = line.match(/^- \[ \] (.+)$/);
  if (item) {
    tasks.push({ phase, workPackage, task: item[1].replaceAll("`", "") });
    continue;
  }
  const acceptance = line.match(/^\*\*(?:Acceptance|Done when):\*\* (.+)$/);
  if (acceptance && groupDetails.has(workPackage)) {
    groupDetails.get(workPackage).acceptance = acceptance[1];
  }
}

const phaseDeps = (value) => {
  if (value.startsWith("0.")) return "None";
  if (value.startsWith("1.")) return "0.1 schema verification; 0.2 page/API inventory";
  if (value.startsWith("2.")) return "0.1 and 0.2; POS task 1.1 for checkout stock paths";
  if (value.startsWith("3.")) return "0.1 and 0.2; verify supplier identity for linked flows";
  if (value.startsWith("4.")) return "0.1 and 0.2; Sales task 1.6";
  if (value.startsWith("5.")) return "0.1 and 0.2; Sales, Purchase and Customer dependencies";
  if (value.startsWith("6.")) return "0.1 and 0.2";
  if (value.startsWith("7.")) return "0.1 and 0.2; Inventory and Customer identity where linked";
  if (value.startsWith("8.")) return "0.1 and 0.2; domain waves for enabled features";
  return "Waves 1-8 complete or feature explicitly unavailable";
};

const taskRows = tasks.map((entry, index) => {
  const blockerDeps = phaseDeps(entry.phase);
  return [
    `SQL-${String(index + 1).padStart(3, "0")}`,
    entry.phase,
    entry.workPackage,
    entry.task,
    groupDetails.get(entry.workPackage)?.acceptance || "Complete the task and record evidence that the page/API uses only verified existing SQL objects.",
    blockerDeps,
    "Not Started",
    "",
    null,
    null,
    "",
  ];
});

const blockersHeading = "## Blockers / decisions to track";
const blockerSection = text.slice(text.indexOf(blockersHeading));
const blockerRows = [...blockerSection.matchAll(/^\| (B-\d+) \| (.+?) \| (.+?) \| (.+?) \|$/gm)].map((m) => [
  m[1], m[2], m[3], m[4], "Open", "", "",
]);

const workbook = Workbook.create();
const overview = workbook.worksheets.add("Overview");
const taskSheet = workbook.worksheets.add("Tasks");
const blockers = workbook.worksheets.add("Blockers");
for (const sheet of [overview, taskSheet, blockers]) sheet.showGridLines = false;

const font = "Arial";
overview.getRange("A1:D1").values = [["Mongo-free SQL migration", null, null, null]];
overview.getRange("A1:D1").format = {
  font: { name: font, size: 16, bold: true, color: "#17365D" },
};
overview.getRange("A3:B5").values = [
  ["As of", new Date(2026, 9, 2)],
  ["Rule", "Existing SQL objects only. No DDL or migrations."],
  ["Update process", "When a migration task is completed, set Status to Done and fill Completed Date and Evidence / Notes."],
];
overview.getRange("A3:A5").format.font = { name: font, size: 10, bold: true, color: "#17365D" };
overview.getRange("B3").setNumberFormat("yyyy-mm-dd");
overview.getRange("A7:B7").values = [["Progress", "Count / Value"]];
overview.getRange("A7:B7").format = {
  fill: "#17365D",
  font: { name: font, size: 10, bold: true, color: "#FFFFFF" },
  horizontalAlignment: "center",
  verticalAlignment: "center",
};
const lastTaskRow = taskRows.length + 1;
overview.getRange("A8:A14").values = [
  ["Total tasks"],
  ["Completed"],
  ["In progress"],
  ["Blocked"],
  ["Not started"],
  ["Completion"],
  ["Open blockers"],
];
overview.getRange("B8:B14").formulas = [
  [`=COUNTA(Tasks!A2:A${lastTaskRow})`],
  [`=COUNTIF(Tasks!G2:G${lastTaskRow},"Done")`],
  [`=COUNTIF(Tasks!G2:G${lastTaskRow},"In Progress")`],
  [`=COUNTIF(Tasks!G2:G${lastTaskRow},"Blocked")`],
  [`=COUNTIF(Tasks!G2:G${lastTaskRow},"Not Started")`],
  ["=IF(B8=0,0,B9/B8)"],
  [`=COUNTIF(Blockers!E2:E${blockerRows.length + 1},"Open")`],
];
overview.getRange("B13").setNumberFormat("0.0%");
overview.getRange("A8:B14").format.font = { name: font, size: 10, color: "#243447" };
overview.getRange("A8:A14").format.font = { name: font, size: 10, bold: true, color: "#243447" };
overview.getRange("A8:B14").format.borders = {
  insideHorizontal: { style: "thin", color: "#D9E2F3" },
  bottom: { style: "thin", color: "#D9E2F3" },
};
overview.getRange("A17:D17").values = [["How to maintain this tracker", null, null, null]];
overview.getRange("A17:D17").format = {
  fill: "#D9EAF7",
  font: { name: font, size: 10, bold: true, color: "#17365D" },
};
overview.getRange("A18:D19").merge();
overview.getRange("A18").values = [["Update the matching task row after implementation and verification. Set Status, Completed Date and Evidence / Notes. Keep blocked tasks open until the stated SQL-schema evidence or product decision is recorded. No database schema changes are allowed."]];
overview.getRange("A18:D19").format = {
  font: { name: font, size: 10, color: "#243447" },
  wrapText: true,
  verticalAlignment: "center",
};
overview.getRange("A18:D19").format.rowHeight = 30;
overview.getRange("A:A").format.columnWidth = 26;
overview.getRange("B:B").format.columnWidth = 72;
overview.getRange("C:D").format.columnWidth = 18;
overview.getRange("A3:B5").format.wrapText = true;
overview.getRange("A3:A5").format.verticalAlignment = "center";
overview.freezePanes.freezeRows(7);

taskSheet.getRange(`A1:K${lastTaskRow}`).values = [
  ["Task ID", "Phase", "Work package", "Task", "Acceptance / evidence", "Dependencies", "Status", "Owner", "Target date", "Completed date", "Evidence / notes"],
  ...taskRows,
];
taskSheet.getRange("A1:K1").format = {
  fill: "#17365D",
  font: { name: font, size: 10, bold: true, color: "#FFFFFF" },
  horizontalAlignment: "center",
  verticalAlignment: "center",
  wrapText: true,
};
taskSheet.getRange(`A2:K${lastTaskRow}`).format = {
  font: { name: font, size: 10, color: "#243447" },
  verticalAlignment: "center",
  wrapText: true,
};
taskSheet.getRange(`I2:J${lastTaskRow}`).setNumberFormat("yyyy-mm-dd");
taskSheet.getRange(`G2:G${lastTaskRow}`).dataValidation = {
  rule: { type: "list", values: ["Not Started", "In Progress", "Blocked", "Done"] },
};
taskSheet.getRange(`G2:G${lastTaskRow}`).conditionalFormats.add("containsText", {
  text: "Done",
  format: { fill: "#E2F0D9", font: { color: "#375623", bold: true } },
});
taskSheet.getRange(`G2:G${lastTaskRow}`).conditionalFormats.add("containsText", {
  text: "Blocked",
  format: { fill: "#FCE4D6", font: { color: "#9C0006", bold: true } },
});
taskSheet.getRange(`G2:G${lastTaskRow}`).conditionalFormats.add("containsText", {
  text: "In Progress",
  format: { fill: "#FFF2CC", font: { color: "#7F6000", bold: true } },
});
const taskTable = taskSheet.tables.add(`A1:K${lastTaskRow}`, true, "MigrationTasks");
taskTable.style = "TableStyleMedium2";
taskSheet.getRange("A:A").format.columnWidth = 12;
taskSheet.getRange("B:B").format.columnWidth = 30;
taskSheet.getRange("C:C").format.columnWidth = 42;
taskSheet.getRange("D:D").format.columnWidth = 72;
taskSheet.getRange("E:E").format.columnWidth = 68;
taskSheet.getRange("F:F").format.columnWidth = 42;
taskSheet.getRange("G:G").format.columnWidth = 17;
taskSheet.getRange("H:H").format.columnWidth = 18;
taskSheet.getRange("I:J").format.columnWidth = 16;
taskSheet.getRange("K:K").format.columnWidth = 54;
taskSheet.getRange("A1:K1").format.rowHeight = 34;
taskSheet.freezePanes.freezeRows(1);

blockers.getRange(`A1:G${blockerRows.length + 1}`).values = [
  ["Blocker ID", "Blocker", "Blocks", "Resolution evidence", "Status", "Owner", "Notes"],
  ...blockerRows,
];
blockers.getRange("A1:G1").format = {
  fill: "#17365D",
  font: { name: font, size: 10, bold: true, color: "#FFFFFF" },
  horizontalAlignment: "center",
  verticalAlignment: "center",
  wrapText: true,
};
blockers.getRange(`A2:G${blockerRows.length + 1}`).format = {
  font: { name: font, size: 10, color: "#243447" },
  verticalAlignment: "center",
  wrapText: true,
};
blockers.getRange(`E2:E${blockerRows.length + 1}`).dataValidation = {
  rule: { type: "list", values: ["Open", "In Progress", "Resolved"] },
};
blockers.getRange(`E2:E${blockerRows.length + 1}`).conditionalFormats.add("containsText", {
  text: "Open",
  format: { fill: "#FCE4D6", font: { color: "#9C0006", bold: true } },
});
const blockerTable = blockers.tables.add(`A1:G${blockerRows.length + 1}`, true, "MigrationBlockers");
blockerTable.style = "TableStyleMedium2";
blockers.getRange("A:A").format.columnWidth = 13;
blockers.getRange("B:B").format.columnWidth = 58;
blockers.getRange("C:C").format.columnWidth = 46;
blockers.getRange("D:D").format.columnWidth = 70;
blockers.getRange("E:E").format.columnWidth = 16;
blockers.getRange("F:F").format.columnWidth = 18;
blockers.getRange("G:G").format.columnWidth = 48;
blockers.getRange("A1:G1").format.rowHeight = 32;
blockers.freezePanes.freezeRows(1);

workbook.recalculate();
const overviewCheck = await workbook.inspect({
  kind: "table",
  range: "Overview!A7:B14",
  include: "values,formulas",
  tableMaxRows: 12,
  tableMaxCols: 3,
});
const taskCheck = await workbook.inspect({
  kind: "table",
  range: `Tasks!A1:K${Math.min(lastTaskRow, 7)}`,
  include: "values",
  tableMaxRows: 8,
  tableMaxCols: 11,
  tableMaxCellChars: 100,
});
const workbookCheck = await workbook.inspect({
  kind: "workbook,sheet,table",
  maxChars: 2200,
  tableMaxRows: 3,
  tableMaxCols: 6,
});
console.log("taskCount", tasks.length, "blockerCount", blockerRows.length);
console.log(overviewCheck.ndjson);
console.log(taskCheck.ndjson);
console.log(workbookCheck.ndjson);

const preview = await workbook.render({ sheetName: "Overview", autoCrop: "all", scale: 1, format: "png" });
await fs.writeFile(path.join(outputDir, "overview_preview.png"), new Uint8Array(await preview.arrayBuffer()));
const taskPreview = await workbook.render({ sheetName: "Tasks", range: "A1:G12", scale: 1, format: "png" });
await fs.writeFile(path.join(outputDir, "tasks_preview.png"), new Uint8Array(await taskPreview.arrayBuffer()));
const blockerPreview = await workbook.render({ sheetName: "Blockers", autoCrop: "all", scale: 1, format: "png" });
await fs.writeFile(path.join(outputDir, "blockers_preview.png"), new Uint8Array(await blockerPreview.arrayBuffer()));
const xlsx = await SpreadsheetFile.exportXlsx(workbook);
const xlsxPath = path.join(outputDir, "Mongo_Free_SQL_Migration_Tracker.xlsx");
await xlsx.save(xlsxPath);
console.log("saved", xlsxPath);
