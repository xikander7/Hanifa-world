import { describe, expect, it } from "vitest";
import { ASK_MODES, buildPrompt, chatGptLink, validateAsk } from "@/lib/askPrompt";

describe("Ask a Helper prompts", () => {
  it("always tells ChatGPT who she is, her level and how to talk to her", () => {
    for (const mode of ASK_MODES) {
      const prompt = buildPrompt({ level: 8, topic: "Python", mode: mode.id, question: "what is a loop?" });
      expect(prompt).toContain("17-year-old");
      expect(prompt).toContain("level 8: Python");
      expect(prompt).toContain("simple words");
    }
  });
  it("asks to teach instead of just giving answers when she is stuck", () => {
    const prompt = buildPrompt({ level: 8, topic: "Python", mode: "error", question: "IndentationError on line 3" });
    expect(prompt).toContain("IndentationError on line 3");
    expect(prompt).toMatch(/don't just give me the final answer/i);
  });
  it("makes quizzes one question at a time and explanations end with a check question", () => {
    expect(buildPrompt({ level: 1, topic: "Computer Basics", mode: "quiz", question: "" })).toMatch(/ONE question at a time/);
    expect(buildPrompt({ level: 1, topic: "Computer Basics", mode: "explain", question: "" })).toContain("check that I understood");
  });
  it("falls back to the topic when she leaves the box empty", () => {
    expect(buildPrompt({ level: 3, topic: "Excel / Google Sheets", mode: "explain", question: "  " })).toContain("step by step: Excel / Google Sheets");
  });
  it("only insists on text for the modes that need it", () => {
    expect(validateAsk("explain", "")).toBeNull();
    expect(validateAsk("error", "")).toMatch(/few words/);
    expect(validateAsk("check", "abc")).toMatch(/few words/);
    expect(validateAsk("check", "RAM is short-term memory")).toBeNull();
  });
  it("builds a link that opens ChatGPT with the question typed in", () => {
    const link = chatGptLink("Hi there & welcome?");
    expect(link.startsWith("https://chatgpt.com/?q=")).toBe(true);
    expect(decodeURIComponent(link.split("?q=")[1])).toBe("Hi there & welcome?");
  });
});
