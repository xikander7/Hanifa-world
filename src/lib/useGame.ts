"use client";

import { useMemo } from "react";
import { EMPTY_BRAIN, EMPTY_INBOX, EMPTY_LIST, EMPTY_QUESTS, EMPTY_ROADMAP, EMPTY_SKILL_PROOF, IMPORTED_ACTIVITY, KEYS, localDate } from "./data";
import type { Activity, Brain, InboxMessage, Quest, RoadmapProgress, SkillProofMap } from "./data";
import { computeGame } from "./game";
import { useLocalStore } from "./store";

type Flagged = { saved?: boolean; note?: string };

/** One hook that turns everything Hanifa has done into XP, level, streak and badges. */
export function useGame() {
  const [activity] = useLocalStore<Activity[]>(KEYS.activity, IMPORTED_ACTIVITY);
  const [brain] = useLocalStore<Brain>(KEYS.brain, EMPTY_BRAIN);
  const [quests] = useLocalStore<Quest[]>(KEYS.quests, EMPTY_QUESTS);
  const [roadmap] = useLocalStore<RoadmapProgress>(KEYS.roadmap, EMPTY_ROADMAP);
  const [skills] = useLocalStore<SkillProofMap>(KEYS.skillProof, EMPTY_SKILL_PROOF);
  const [scholarships] = useLocalStore<Flagged[]>(KEYS.scholarships, EMPTY_LIST);
  const [unis] = useLocalStore<Flagged[]>(KEYS.unis, EMPTY_LIST);
  const [inbox] = useLocalStore<InboxMessage[]>(KEYS.inbox, EMPTY_INBOX);
  const today = localDate();
  return useMemo(() => computeGame({
    activity, brain, quests, roadmap, skills, today,
    savedDreams: scholarships.filter(s => s.saved).length + unis.filter(u => u.note?.trim()).length,
    mentorNotes: inbox.length + activity.reduce((n, a) => n + (a.comments?.filter(c => c.by === "mentor").length ?? 0), 0),
  }), [activity, brain, quests, roadmap, skills, scholarships, unis, inbox, today]);
}
