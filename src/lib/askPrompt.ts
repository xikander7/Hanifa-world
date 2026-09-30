// Builds the message Hanifa sends to ChatGPT from the "Ask" page. The wording is written so the answer is
// simple, patient and teaches her to do the work herself instead of just handing over answers.

export type AskMode = "explain" | "example" | "quiz" | "why" | "error" | "check";

export type AskModeInfo = {
  id: AskMode; emoji: string; label: string; hint: string;
  /** Whether she has to type something for this kind of help. */
  needsText: boolean; textLabel: string; placeholder: string;
};

export const ASK_MODES: AskModeInfo[] = [
  { id: "explain", emoji: "💡", label: "Explain it simply", hint: "I don't get it", needsText: false, textLabel: "What do you want explained? (optional)", placeholder: "Example: What is RAM and why does it matter?" },
  { id: "example", emoji: "🧩", label: "Show me an example", hint: "Real-life examples", needsText: false, textLabel: "Example of what? (optional)", placeholder: "Example: A for loop" },
  { id: "quiz", emoji: "🎯", label: "Quiz me", hint: "Test what I know", needsText: false, textLabel: "Anything special to practise? (optional)", placeholder: "Example: Only easy questions please" },
  { id: "why", emoji: "🌍", label: "Why do I need this?", hint: "Where is it used?", needsText: false, textLabel: "Why do you want to know? (optional)", placeholder: "Example: I'm not sure this is useful" },
  { id: "error", emoji: "🛠️", label: "I'm stuck on a problem", hint: "Help me fix it myself", needsText: true, textLabel: "What is the problem? Paste any error message.", placeholder: "Example: My code says 'IndentationError' and I don't know why" },
  { id: "check", emoji: "✅", label: "Check if I understood", hint: "Tell me if I'm right", needsText: true, textLabel: "Explain it in your own words:", placeholder: "Example: RAM is the computer's short-term memory, it forgets when switched off" },
];

export const modeInfo = (mode: AskMode) => ASK_MODES.find(m => m.id === mode) ?? ASK_MODES[0];

export type AskInput = { level: number; topic: string; mode: AskMode; question: string };

export function buildPrompt({ level, topic, mode, question }: AskInput): string {
  const q = question.trim();
  const about = q || topic;
  const intro = `Hi! I'm a 17-year-old student learning technology skills from the very beginning. Right now I'm on level ${level}: ${topic}. Please talk to me like a friendly, patient teacher: use simple words, short sentences and everyday examples. Please don't write long lectures.`;
  const ending = "At the end, ask me one small question to check that I understood.";
  const body: Record<AskMode, string> = {
    explain: `Please explain this to me simply, step by step: ${about}`,
    example: `Please give me 2 easy real-life examples of: ${about}. Then give me one tiny thing I can try by myself.`,
    quiz: `Please quiz me on ${topic}. Ask me ONE question at a time and wait for my answer. After each answer, tell me kindly whether I was right and explain why. Start with an easy question.${q ? ` Extra request from me: ${q}` : ""}`,
    why: `Why do I need to learn ${topic}? Where would I use it in real life? Keep it short and motivating.${q ? ` A bit more about me: ${q}` : ""}`,
    error: `I'm stuck on a problem: ${q}\n\nPlease don't just give me the final answer. Help me understand what is going wrong, and guide me to fix it myself, one small step at a time.`,
    check: `I think I understand this. Here is my explanation in my own words: ${q}\n\nPlease tell me if I'm right, kindly correct anything that's wrong, and add anything important that I missed.`,
  };
  return [intro, body[mode], mode === "quiz" ? "" : ending].filter(Boolean).join("\n\n");
}

export const CHATGPT_URL = "https://chatgpt.com/";

/** Opens ChatGPT with the message already typed in the box. */
export const chatGptLink = (prompt: string) => `${CHATGPT_URL}?q=${encodeURIComponent(prompt)}`;

/** Returns a friendly message if something is missing, otherwise null. */
export function validateAsk(mode: AskMode, question: string): string | null {
  return modeInfo(mode).needsText && question.trim().length < 5 ? "Please write a few words first so ChatGPT knows what you need help with." : null;
}
