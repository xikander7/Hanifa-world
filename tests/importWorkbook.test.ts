import { describe, expect, it } from "vitest";
import * as XLSX from "xlsx";
import { importWorkbook } from "@/domain/importWorkbook";

describe("workbook import", () => {
  it("maps all five source sheets and preserves meaningful values", () => {
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet([{ Week: "Week 1", "Current Topic": "Python", "Progress %": 0.5, "What I Learned": "loops" }]), "Weekly Learning Updates");
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet([{ "#": 1, Topic: "Python", "Approx. time": "4 weeks", "What she must learn": "functions" }]), "Hanifa Training Plan");
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet([{ Rank: 1, "University / Option": "University of Sindh", "City / Mode": "Jamshoro" }]), "Pakistan Uni Options");
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet([{ Rank: 1, Country: "Turkey", University: "METU" }]), "Scholarship Links");
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet([{ Rank: 1, Country: "Turkey", "Scholarship route": "Türkiye Scholarships" }]), "Scholarship Options Ranking");
    const result = importWorkbook(wb, "test.xlsx");
    expect(result.skills[0].topic).toBe("Python");
    expect(result.weeklyReviews[0].learned).toBe("loops");
    expect(result.universities[0].status).toBe("Primary Target");
    expect(result.scholarships[0].country).toBe("Turkey");
    expect(result.scholarshipRankings[0].route).toContain("Türkiye");
    expect(result.diagnostics).toHaveLength(5);
  });
});
