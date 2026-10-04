/**
 * Adds the shop's staff to Textilesoft's existing dbo.newemployee table (rows only: no table or column is created or changed).
 *   cd backend
 *   npx tsx src/scripts/seedStaff.ts            -> dry run: shows column types and what would be added
 *   npx tsx src/scripts/seedStaff.ts --apply    -> inserts the staff that are not there yet (safe to re-run)
 * Name = English spelling, Tamil name goes in the Tamil-name field. Codes are allocated the normal Textilesoft way (next number). The shop's Staff ID (STF001...) is kept in the ID No. field.
 */
import "dotenv/config";
import { createEmployee, listEmployees } from "../integrations/textilesoft/sqlEmployees.js";
import { sqlRead } from "../integrations/textilesoft/sqlWrite.js";

// [Staff ID, English name (name_eng is varchar, so it cannot hold Tamil), Tamil name (name_tam is nvarchar)]
// The English spellings are transliterations: check them in the dry run and correct any in the Staff page.
const STAFF: Array<[string, string, string]> = [
  ["STF001", "Anusuya", "அனுசுயா"], ["STF002", "Manimala", "மணிமாலா"], ["STF003", "Dhanushree", "தனுஸ்ரீ"],
  ["STF004", "Priya Dharshini", "பிரிய தர்ஷினி"], ["STF005", "Suneka", "சுனேகா"], ["STF006", "Mary", "மேரி"],
  ["STF007", "Jerlin", "ஜெர்லின்"], ["STF008", "Monika", "மோனிகா"], ["STF009", "Priya", "பிரியா"],
  ["STF010", "Mariyammal", "மாரியம்மாள்"], ["STF011", "Esakkiamman", "இசக்கியம்மான்"], ["STF012", "Malathi", "மாலதி"],
  // No Staff ID was given for these, so the ID No. field is left blank.
  ["", "Ramaiah", "ராமையா"], ["", "Suresh", "சுரேஷ்"], ["", "Manogal", "மனோகள்"], ["", "Kasi", "காசி"],
  ["", "Raghava", "ராகவா"], ["", "Mariyappan", "மாரியப்பன்"], ["", "Mayandi", "மாயாண்டி"],
  ["", "Muthappa", "முத்தப்பா"], ["", "Adhi Narayanan", "ஆதி நாராயணன்"], ["", "Chandana Kumar", "சந்தன குமார்"],
  ["", "Ravi Kumar", ""], // English name only was given
];

const apply = process.argv.includes("--apply");

async function main(): Promise<void> {
  const types = await sqlRead(
    "SELECT COLUMN_NAME AS c, DATA_TYPE AS t, CHARACTER_MAXIMUM_LENGTH AS n FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA='dbo' AND TABLE_NAME='newemployee' AND COLUMN_NAME IN ('name_eng','name_tam','id_cd_nu')",
  );
  for (const r of types) console.log(`  ${String(r.c).padEnd(10)} ${r.t}(${r.n})`);
  const nameCol = types.find((r) => String(r.c) === "name_tam");
  if (!nameCol || !/^n(var)?char$/i.test(String(nameCol.t))) {
    console.log("\nSTOP: name_tam is not a Unicode (nvarchar) column, so Tamil names would be saved as '?'. Nothing was changed.");
    process.exit(2);
  }
  const have = await listEmployees();
  const names = new Set(have.map((e) => (e.name_eng ?? "").trim()));
  const todo = STAFF.filter(([, en]) => !names.has(en));
  console.log(`\n${have.length} staff already in newemployee; ${todo.length} of ${STAFF.length} to add.`);
  for (const [id, en, ta] of todo) console.log(`  ${(id || "(no id)").padEnd(8)} ${en.padEnd(16)} ${ta}`);
  if (!apply) { console.log("\nDry run only. Add --apply to insert."); process.exit(0); }
  for (const [id, en, ta] of todo) {
    const e = await createEmployee({ name: en, ...(ta ? { nameTamil: ta } : {}), ...(id ? { idNo: id } : {}) });
    console.log(`added code ${e.code}  ${id || "(no id)"}  ${e.name_eng}`);
  }
  console.log("\nDone.");
  process.exit(0);
}
main().catch((e) => { console.error("ERR", e.message); process.exit(1); });
