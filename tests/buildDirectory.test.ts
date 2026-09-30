import { describe, expect, it } from "vitest";
import { getNextBuildDirectory } from "@/lib/build-directory";

describe("Next.js build output directories", () => {
  it("keeps production builds separate from the live development server", () => {
    expect(getNextBuildDirectory("development", false)).toBe(".next");
    expect(getNextBuildDirectory("production", false)).toBe(".next-production");
  });

  it("uses .next on Vercel, which only looks there", () => {
    expect(getNextBuildDirectory("production", true)).toBe(".next");
  });
});
