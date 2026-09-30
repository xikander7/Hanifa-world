import { describe, expect, it } from "vitest";
import { canPassStage, getStageState } from "@/lib/roadmap-progress";

describe("roadmap stage progression", () => {
  it("keeps every stage after the first locked until the prior stage is passed", () => {
    const stages = ["module-1", "module-2", "module-3"];
    expect(getStageState(0, stages, [])).toBe("ready");
    expect(getStageState(1, stages, [])).toBe("locked");
    expect(getStageState(1, stages, ["module-1"])).toBe("ready");
    expect(getStageState(0, stages, ["module-1"])).toBe("passed");
  });

  it("only allows a pass after every resource and practice task is checked", () => {
    const requiredResources = ["video-1", "reading-1"];
    const requiredPractice = ["task-1", "task-2"];
    expect(canPassStage(requiredResources, requiredPractice, ["video-1"], ["task-1", "task-2"])).toBe(false);
    expect(canPassStage(requiredResources, requiredPractice, requiredResources, requiredPractice)).toBe(true);
  });
});
