import { describe, expect, it } from "vitest";
import { can } from "@/domain/permissions";

describe("role permissions", () => {
  it("allows Hanifa to submit work but never approve it", () => {
    expect(can("learner", "submit_work")).toBe(true);
    expect(can("learner", "approve_milestone")).toBe(false);
  });

  it("allows Mentor to approve and import", () => {
    expect(can("mentor", "approve_milestone")).toBe(true);
    expect(can("mentor", "import_workbook")).toBe(true);
  });
});
