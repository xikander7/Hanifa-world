import { describe, expect, it } from "vitest";
import roadmap from "@/data/roadmap.json";

describe("curated roadmap data", () => {
  it("contains the source document's 20-module order with resources and practice", () => {
    expect(roadmap).toHaveLength(20);
    roadmap.forEach((module, index) => {
      expect(module.number).toBe(index + 1);
      expect(module.title).toBeTruthy();
      expect(module.resources.length).toBeGreaterThan(0);
      expect(module.practice.length).toBeGreaterThan(0);
      module.resources.forEach(resource => {
        expect(resource.links.length).toBeGreaterThan(0);
        resource.links.forEach(link => expect(["http:", "https:"].includes(new URL(link.url).protocol)).toBe(true));
      });
    });
  });
});
