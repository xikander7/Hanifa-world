import * as XLSX from "xlsx";
import type { Scholarship, ScholarshipRanking, University, WeeklyReview, Skill } from "./types";

export interface ImportDiagnostics { sheet: string; rows: number; skipped: number; warnings: string[]; }
export interface ImportedData {
  skills: Skill[]; weeklyReviews: WeeklyReview[]; universities: University[];
  scholarships: Scholarship[]; scholarshipRankings: ScholarshipRanking[]; diagnostics: ImportDiagnostics[];
}

const text = (value: unknown) => value == null ? "" : String(value).trim();
const num = (value: unknown) => { const parsed = Number(value); return Number.isFinite(parsed) ? parsed : 0; };
const rowObjects = (sheet: XLSX.WorkSheet) => XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, { defval: "" });
const rowObjectsFromHeader = (sheet: XLSX.WorkSheet, headerName: string) => {
  const rows = XLSX.utils.sheet_to_json<unknown[]>(sheet, { header: 1, defval: "" });
  const index = rows.findIndex(row => row.some(cell => text(cell) === headerName));
  if (index < 0) return [];
  const headers = (rows[index] as unknown[]).map(text);
  return rows.slice(index + 1).map(row => Object.fromEntries(headers.map((header, i) => [header, (row as unknown[])[i] ?? ""])));
};
const id = (prefix: string, value: unknown) => `${prefix}-${text(value).toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "")}`;

export function importWorkbook(input: XLSX.WorkBook, sourceFileName = "Hanifa Admission Working.xlsx"): ImportedData {
  const sheet = (name: string) => input.Sheets[name];
  const diagnostics: ImportDiagnostics[] = [];
  const weeklyRows = sheet("Weekly Learning Updates") ? rowObjects(sheet("Weekly Learning Updates")) : [];
  const planRows = sheet("Hanifa Training Plan") ? rowObjects(sheet("Hanifa Training Plan")) : [];
  const uniRows = sheet("Pakistan Uni Options") ? rowObjectsFromHeader(sheet("Pakistan Uni Options"), "University / Option") : [];
  const scholarshipRows = sheet("Scholarship Links") ? rowObjects(sheet("Scholarship Links")) : [];
  const rankingRows = sheet("Scholarship Options Ranking") ? rowObjects(sheet("Scholarship Options Ranking")) : [];
  const diag = (name: string, rows: unknown[], skipped: number, warnings: string[] = []) => diagnostics.push({ sheet: name, rows: rows.length, skipped, warnings });

  const skills = planRows.filter(r => text(r["Topic"])).map((r, i) => ({
    id: id("skill", r["Topic"]), sequence: num(r["#"]) || i + 1, topic: text(r["Topic"]), approximateTime: text(r["Approx. time"]),
    whatToLearn: text(r["What she must learn"]), depthComment: text(r["Depth / comment"]), hanifaComments: text(r["Hanifa Comments"]),
    hanifaNotes: text(r["Hanifa Notes"]), mentorComments: text(r["Sikander Comments"]), world: i < 3 ? "Foundation World" : i < 7 ? "Tech World" : i < 12 ? "Coding World" : "Builder World", activityPercent: 0, verifiedStage: "discovering" as const,
  }));
  diag("Hanifa Training Plan", planRows, planRows.length - skills.length);

  const weeklyReviews = weeklyRows.filter(r => text(r["Week"])).map((r, i) => ({ id: `weekly-${i + 1}`, week: text(r["Week"]), currentTopic: text(r["Current Topic"]), progressPercent: num(r["Progress %"]), learned: text(r["What I Learned"]), practice: text(r["Practice Completed"]), proofLink: text(r["Proof / Link"]), difficulty: text(r["Difficulty for you"]), blockers: text(r["Hanifa - Blocker / Questions"]), learnerComments: text(r["Hanifa - comments"]), mentorReview: text(r["Sikander Review"]), sourceSheet: "Weekly Learning Updates", sourceRow: i + 2 }));
  diag("Weekly Learning Updates", weeklyRows, weeklyRows.length - weeklyReviews.length);

  const uniData = uniRows.filter(r => text(r["University / Option"])).map((r, i) => ({ id: id("university", r["University / Option"]), rank: num(r.Rank) || i + 1, name: text(r["University / Option"]), cityMode: text(r["City / Mode"]), bestIf: text(r["Best if…"] || r["Best if..."]), cost: text(r["Approx tuition / academic cost"]), extraCost: text(r["Extra cost burden"]), admissionTiming: text(r["Admission timing from Apr 3, 2026"]), ease: text(r["Ease of admission"]), supportSelf: text(r["Can she support herself while studying?"]), futureValue: text(r["Future value for master’s abroad"] || r["Future value for master's abroad"]), verdict: text(r["My simple verdict"]), status: text(r["University / Option"]).toLowerCase().includes("sindh") ? "Primary Target" : "Considering" }));
  diag("Pakistan Uni Options", uniRows, uniRows.length - uniData.length);

  const scholarships = scholarshipRows.filter(r => text(r.University)).map((r, i) => ({ id: `scholarship-${i + 1}-${id("", r.University)}`, rank: num(r.Rank) || i + 1, country: text(r.Country), university: text(r.University), applyLink: text(r["Scholarship apply link"]), infoLink: text(r["University admission / official info link"]), howToApply: text(r["How to apply"]) }));
  diag("Scholarship Links", scholarshipRows, scholarshipRows.length - scholarships.length);

  const rankings = rankingRows.filter(r => text(r.Country)).map((r, i) => ({ id: `ranking-${i + 1}-${id("", r.Country)}`, rank: num(r.Rank) || i + 1, country: text(r.Country), universities: text(r["Example university names"]), route: text(r["Scholarship route"]), studyCost: text(r["Approx study cost before scholarship (USD)"]), livingCost: text(r["Approx living cost (USD)"]), canSupportSelf: text(r["Can student support self?"]), jobChance: text(r["Job chance after degree"]), admissionDates: text(r["Next likely admission dates"]), ease: text(r["Easy to get admission?"]), bestForCs: text(r["Best for CS?"]), comments: text(r.Comments) }));
  diag("Scholarship Options Ranking", rankingRows, rankingRows.length - rankings.length);
  return { skills, weeklyReviews, universities: uniData, scholarships, scholarshipRankings: rankings, diagnostics };
}

export function loadWorkbook(buffer: ArrayBuffer, sourceFileName?: string) { return importWorkbook(XLSX.read(buffer, { type: "array" }), sourceFileName); }
