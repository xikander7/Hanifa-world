import type { NovaMood } from "@/components/Nova";
import type { Game } from "./game";

export type NovaLine = { mood: NovaMood; text: string };

/** Nova's line of the moment, based on the time of day and how Hanifa is doing. */
export function novaSays(game: Game, hour: number, name = "Hanifa"): NovaLine {
  const { streak, today, levelProgress, xpToNext } = game;
  if (today.perfect) return { mood: "cheer", text: `PERFECT DAY, ${name}! All three goals done. I'm so proud of you! 🎉` };
  if (hour >= 23 || hour < 5) return { mood: "sleepy", text: "It's late. Your brain stores what you learned while you sleep. Rest up, star. 😴" };
  if (!today.brain && game.xp === 0) return { mood: "happy", text: `Hi ${name}! I'm Nova. Start with the Daily 3 and let's earn your first XP together ✨` };
  if (streak.current >= 3 && !streak.aliveToday && hour >= 18) return { mood: "think", text: `Your ${streak.current}-day streak is waiting for you tonight. Even 10 minutes keeps it alive! 🔥` };
  if (xpToNext <= 40 && xpToNext > 0) return { mood: "cheer", text: `Only ${xpToNext} XP until your next level. One quick quiz could do it! 🚀` };
  if (streak.current >= 7) return { mood: "cheer", text: `${streak.current} days in a row! You're officially unstoppable. 🌋` };
  if (today.done === 2) return { mood: "cheer", text: "One goal left for a Perfect Day (+50 XP bonus). You've got this!" };
  if (today.done === 1) return { mood: "happy", text: "Nice start! Two more goals today and you'll earn a bonus. 💪" };
  if (hour < 12) return { mood: "happy", text: `Good morning, ${name}! A fresh day, a fresh chance to level up. What shall we learn? ☀️` };
  if (hour < 18) return { mood: "happy", text: `Hey ${name}! Pop in a focus session and watch that XP bar move. ⏱️` };
  return { mood: "think", text: levelProgress > 50 ? "You're over halfway to the next level. Finish strong tonight! 🌙" : "Evening study vibes. Quick flashcards before bed work really well. 🌙" };
}
