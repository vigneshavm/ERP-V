/**
 * Sets the Category of every staff member whose category is blank in Textilesoft's dbo.newemployee to SALESMAN (rows only; no table/column change).
 *   cd backend
 *   npx tsx src/scripts/setStaffCategory.ts            -> dry run: shows what would change
 *   npx tsx src/scripts/setStaffCategory.ts --apply    -> saves it
 */
import "dotenv/config";
import { listEmployees, updateEmployee } from "../integrations/textilesoft/sqlEmployees.js";

const CATEGORY = "SALESMAN";
const apply = process.argv.includes("--apply");

async function main(): Promise<void> {
  const staff = await listEmployees();
  const todo = staff.filter((e) => (e.category ?? "").trim() === ""); // only blank categories; existing ones (CAT1, SUPERVISIOR ...) are left alone
  console.log(`${staff.length} staff; ${todo.length} have a blank category and will become ${CATEGORY}.`);
  for (const e of todo) console.log(`  code ${String(e.code).padEnd(4)} ${String(e.name ?? "").padEnd(18)} category: ${(e.category ?? "").trim() || "(blank)"}`);
  if (!apply) { console.log("\nDry run only. Add --apply to save."); process.exit(0); }
  for (const e of todo) { await updateEmployee(e.code, { category: CATEGORY }); console.log(`updated ${e.code} ${e.name}`); }
  console.log("\nDone.");
  process.exit(0);
}
main().catch((e) => { console.error("ERR", e.message); process.exit(1); });
