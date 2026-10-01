"use client";

export type NovaMood = "happy" | "cheer" | "think" | "sleepy";

/**
 * Nova, Hanifa's little yellow buddy: a round helper with one big goggle and blue overalls.
 * Blinks, floats, waves when cheering, and changes face with the mood.
 */
export function Nova({ mood = "happy", size = 120, float = true, className = "" }: { mood?: NovaMood; size?: number; float?: boolean; className?: string }) {
  const eye = { transformBox: "fill-box" as const, transformOrigin: "center" };
  const ink = "#2b2140";
  return <svg viewBox="0 0 120 120" width={size} height={size} role="img" aria-label="Nova, your little yellow buddy" className={`${float ? "animate-float" : ""} ${className}`} overflow="visible">
    <defs>
      <linearGradient id="nova-skin" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#ffe066" /><stop offset="1" stopColor="#fbbf24" /></linearGradient>
      <linearGradient id="nova-denim" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#3b82f6" /><stop offset="1" stopColor="#1d4ed8" /></linearGradient>
      <radialGradient id="nova-lens" cx=".4" cy=".35" r=".7"><stop offset="0" stopColor="#f1f5f9" /><stop offset="1" stopColor="#94a3b8" /></radialGradient>
    </defs>
    <ellipse cx="60" cy="114" rx="24" ry="4" fill="rgb(var(--ink) / .12)" />

    {/* arms: both up when cheering, one waving otherwise */}
    {mood === "cheer"
      ? <g stroke="#fbbf24" strokeWidth="7" strokeLinecap="round" fill="none"><path d="M33 70 Q20 58 18 44" /><path d="M87 70 Q100 58 102 44" /><circle cx="18" cy="42" r="4.5" fill={ink} stroke="none" /><circle cx="102" cy="42" r="4.5" fill={ink} stroke="none" /></g>
      : <g stroke="#fbbf24" strokeWidth="7" strokeLinecap="round" fill="none"><path d="M33 74 Q24 82 24 92" /><g className={mood === "happy" ? "animate-wave" : ""} style={{ transformBox: "fill-box", transformOrigin: "0% 100%" }}><path d="M87 72 Q98 62 100 50" /><circle cx="100" cy="48" r="4.5" fill={ink} stroke="none" /></g><circle cx="24" cy="94" r="4.5" fill={ink} stroke="none" /></g>}

    {/* legs + shoes */}
    <rect x="46" y="98" width="9" height="10" rx="3" fill="url(#nova-denim)" /><rect x="65" y="98" width="9" height="10" rx="3" fill="url(#nova-denim)" />
    <ellipse cx="49" cy="109" rx="8" ry="4" fill={ink} /><ellipse cx="71" cy="109" rx="8" ry="4" fill={ink} />

    {/* body */}
    <rect x="32" y="14" width="56" height="90" rx="28" fill="url(#nova-skin)" />
    <path d="M40 22 Q46 16 54 15" stroke="white" strokeOpacity=".5" strokeWidth="4" strokeLinecap="round" fill="none" />

    {/* hair */}
    <g stroke={ink} strokeWidth="1.6" strokeLinecap="round" fill="none"><path d="M56 15 Q54 6 50 3" /><path d="M60 14 Q60 5 61 1" /><path d="M64 15 Q67 7 71 4" /></g>

    {/* overalls */}
    <path d="M32 76 H88 V78 Q88 104 60 104 Q32 104 32 78 Z" fill="url(#nova-denim)" />
    <rect x="46" y="72" width="28" height="16" rx="4" fill="url(#nova-denim)" />
    <path d="M34 66 L47 74 M86 66 L73 74" stroke="#1d4ed8" strokeWidth="4" strokeLinecap="round" />
    <circle cx="48" cy="75" r="2" fill="#fde68a" /><circle cx="72" cy="75" r="2" fill="#fde68a" />
    <path d="M53 80 H67 V85 Q60 88 53 85 Z" fill="#1e40af" opacity=".6" />
    <text x="60" y="85" textAnchor="middle" fontSize="6" fontWeight="800" fill="#bfdbfe" fontFamily="var(--font-display)">H</text>

    {/* goggle strap + goggle */}
    <rect x="31" y="38" width="58" height="8" fill={ink} />
    <circle cx="60" cy="42" r="15" fill="url(#nova-lens)" stroke="#64748b" strokeWidth="2" />
    {mood === "sleepy"
      ? <path d="M51 43 Q60 49 69 43" stroke={ink} strokeWidth="3" strokeLinecap="round" fill="none" />
      : <g className="animate-blink" style={eye}>
          <circle cx="60" cy="42" r="10.5" fill="white" />
          <circle cx={mood === "think" ? 63 : 60} cy={mood === "think" ? 38 : 43} r="5.5" fill="#7c4a1e" />
          <circle cx={mood === "think" ? 63 : 60} cy={mood === "think" ? 38 : 43} r="3" fill={ink} />
          <circle cx={mood === "think" ? 61 : 58} cy={mood === "think" ? 36 : 41} r="1.4" fill="white" />
        </g>}
    <circle cx="60" cy="42" r="12" fill="none" stroke="white" strokeOpacity=".35" strokeWidth="1.5" />

    {/* cheeks + mouth */}
    <ellipse cx="42" cy="58" rx="4.5" ry="2.6" fill="#fb7185" opacity=".45" /><ellipse cx="78" cy="58" rx="4.5" ry="2.6" fill="#fb7185" opacity=".45" />
    {mood === "cheer" ? <path d="M48 58 Q60 74 72 58 Z" fill={ink} /> : mood === "think" ? <circle cx="64" cy="62" r="2.8" fill={ink} /> : mood === "sleepy" ? <path d="M54 62 Q60 64 66 62" stroke={ink} strokeWidth="2.6" strokeLinecap="round" fill="none" /> : <path d="M50 58 Q60 68 70 58" stroke={ink} strokeWidth="3.2" strokeLinecap="round" fill="none" />}
    {mood === "cheer" && <path d="M53 60 Q60 63 67 60" stroke="white" strokeWidth="2.4" strokeLinecap="round" fill="none" />}

    {mood === "sleepy" && <g fill="rgb(var(--brand2))" fontFamily="var(--font-display)" fontWeight="800"><text x="92" y="24" fontSize="14" className="animate-twinkle">z</text><text x="102" y="12" fontSize="10" className="animate-twinkle" style={{ animationDelay: ".8s" }}>z</text></g>}
    {mood !== "sleepy" && <g fill="rgb(var(--brand3))">
      <path className="animate-twinkle" style={{ transformBox: "fill-box", transformOrigin: "center" }} d="M106 20 l2.4 6.2 6.2 2.4 -6.2 2.4 -2.4 6.2 -2.4 -6.2 -6.2 -2.4 6.2 -2.4z" />
      <path className="animate-twinkle" style={{ transformBox: "fill-box", transformOrigin: "center", animationDelay: "1.2s" }} d="M12 26 l1.8 4.6 4.6 1.8 -4.6 1.8 -1.8 4.6 -1.8 -4.6 -4.6 -1.8 4.6 -1.8z" />
    </g>}
  </svg>;
}
