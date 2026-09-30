export type StageState = "locked" | "ready" | "passed";

export function getStageState(stageIndex: number, stageIds: string[], passedIds: string[]): StageState {
  if (stageIndex < 0 || stageIndex >= stageIds.length) return "locked";
  if (passedIds.includes(stageIds[stageIndex]) && stageIds.slice(0, stageIndex).every(id => passedIds.includes(id))) return "passed";
  return stageIds.slice(0, stageIndex).every(id => passedIds.includes(id)) ? "ready" : "locked";
}

export function canPassStage(
  requiredResourceIds: string[],
  requiredPracticeIds: string[],
  checkedResourceIds: string[],
  checkedPracticeIds: string[],
): boolean {
  return requiredResourceIds.every(id => checkedResourceIds.includes(id))
    && requiredPracticeIds.every(id => checkedPracticeIds.includes(id));
}
