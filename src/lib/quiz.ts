// Shuffles a quiz so the questions and the A/B/C/D slots change every attempt.
// The answer index is recomputed, so the right option always stays marked correct.

export type ShuffleQ = { q: string; options: string[]; answer: number; why: string };

export function shuffle<T>(items: T[], rand: () => number = Math.random): T[] {
  const out = [...items];
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

export function shuffleQuiz<Q extends ShuffleQ>(questions: Q[], rand: () => number = Math.random): Q[] {
  return shuffle(questions, rand).map(question => {
    const order = shuffle(question.options.map((_, i) => i), rand);
    return { ...question, options: order.map(i => question.options[i]), answer: order.indexOf(question.answer) };
  });
}
