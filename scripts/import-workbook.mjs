import fs from "node:fs";
import path from "node:path";
import XLSX from "xlsx";
import { importWorkbook } from "../src/domain/importWorkbook.ts";

const input = process.argv[2] || "docs/source/Hanifa Admission Working.xlsx";
const output = process.argv[3] || "src/data/seed.json";
const workbook = XLSX.readFile(path.resolve(input));
const data = importWorkbook(workbook, path.basename(input));
fs.mkdirSync(path.dirname(path.resolve(output)), { recursive: true });
fs.writeFileSync(path.resolve(output), JSON.stringify({ ...data, profiles: [{ id: "xander", name: "Sikander", role: "mentor" }, { id: "hanifa", name: "Hanifa", role: "learner" }], quests: [], timeLogs: [], submissions: [], approvals: [], importRecords: [] }, null, 2));
console.log(`Imported ${data.skills.length} skills, ${data.weeklyReviews.length} weekly reviews, ${data.universities.length} universities, ${data.scholarships.length} scholarships, and ${data.scholarshipRankings.length} rankings.`);
