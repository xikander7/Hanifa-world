"use client";

export type NovaMood = "happy" | "cheer" | "think" | "sleepy";

/** Nova, Hanifa's little star companion. Blinks, floats, and changes face with the mood. */
export function Nova({ mood = "happy", size = 120, float = true, className = "" }: { mood?: NovaMood; size?: number; float?: boolean; className?: string }) {
  const eyeStyle = { transformBox: "fill-box" as const, transformOrigin: "center" };
  return <svg viewBox="0 0 120 120" width={size} height={size} role="img" aria-label="Nova the star" className={`${float ? "animate-float" : ""} ${className}`} overflow="visible">
    <defs>
      <linearGradient id="nova-body" x1="0" y1="0" x2="1" y2="1"><stop offset="0" style={{ stopColor: "rgb(var(--brand3))" }} /><stop offset="1" style={{ stopColor: "rgb(var(--brand))" }} /></linearGradient>
    </defs>
    <ellipse cx="60" cy="112" rx="26" ry="4.5" fill="rgb(var(--ink) / .12)" />
    <path d="M60 10 L73 41 L107 44 L81 66 L89 99 L60 81 L31 99 L39 66 L13 44 L47 41 Z" fill="url(#nova-body)" stroke="url(#nova-body)" strokeWidth="14" strokeLinejoin="round" />
    <path d="M60 18 L69 42 L97 45" fill="none" stroke="white" strokeOpacity=".35" strokeWidth="4" strokeLinecap="round" />
    {mood === "sleepy" ? <g stroke="rgb(var(--ink))" strokeWidth="3.5" strokeLinecap="round" fill="none"><path d="M40 62 Q46 67 52 62" /><path d="M68 62 Q74 67 80 62" /></g>
      : mood === "cheer" ? <g stroke="rgb(var(--ink))" strokeWidth="3.5" strokeLinecap="round" fill="none"><path d="M40 65 Q46 57 52 65" /><path d="M68 65 Q74 57 80 65" /></g>
      : <g fill="rgb(var(--ink))"><ellipse className="animate-blink" style={eyeStyle} cx="46" cy="62" rx="4.6" ry="6.4" /><ellipse className="animate-blink" style={eyeStyle} cx="74" cy="62" rx="4.6" ry="6.4" /><circle cx="47.6" cy="59.6" r="1.6" fill="white" /><circle cx="75.6" cy="59.6" r="1.6" fill="white" /></g>}
    <ellipse cx="37" cy="72" rx="6" ry="3.6" fill="#fb7185" opacity=".5" /><ellipse cx="83" cy="72" rx="6" ry="3.6" fill="#fb7185" opacity=".5" />
    {mood === "cheer" ? <path d="M50 73 Q60 90 70 73 Z" fill="rgb(var(--ink))" /> : mood === "think" ? <circle cx="62" cy="77" r="3.2" fill="rgb(var(--ink))" /> : mood === "sleepy" ? <path d="M54 77 Q60 79 66 77" stroke="rgb(var(--ink))" strokeWidth="3" strokeLinecap="round" fill="none" /> : <path d="M51 74 Q60 84 69 74" stroke="rgb(var(--ink))" strokeWidth="3.6" strokeLinecap="round" fill="none" />}
    {mood === "sleepy" && <g fill="rgb(var(--brand2))" fontFamily="var(--font-display)" fontWeight="800"><text x="92" y="30" fontSize="14" className="animate-twinkle">z</text><text x="102" y="16" fontSize="10" className="animate-twinkle" style={{ animationDelay: ".8s" }}>z</text></g>}
    {mood !== "sleepy" && <g fill="rgb(var(--brand3))">
      <path className="animate-twinkle" style={{ transformBox: "fill-box", transformOrigin: "center" }} d="M104 18 l2.4 6.2 6.2 2.4 -6.2 2.4 -2.4 6.2 -2.4 -6.2 -6.2 -2.4 6.2 -2.4z" />
      <path className="animate-twinkle" style={{ transformBox: "fill-box", transformOrigin: "center", animationDelay: "1.2s" }} d="M14 26 l1.8 4.6 4.6 1.8 -4.6 1.8 -1.8 4.6 -1.8 -4.6 -4.6 -1.8 4.6 -1.8z" />
    </g>}
  </svg>;
}
