import { describe, expect, it } from "vitest";
import { getNextBuildDirectory } from "@/lib/build-directory";

describe("Next.js build output directories", () => {
  it("keeps production builds separate from the live development server", () => {
    expect(getNextBuildDirectory("development")).toBe(".next");
    expect(getNextBuildDirectory("production")).toBe(".next-production");
  });
});
