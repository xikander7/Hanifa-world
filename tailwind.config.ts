import type { Config } from "tailwindcss";

const channel = (name: string) => `rgb(var(--${name}) / <alpha-value>)`;

export default {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        brand: channel("brand"),
        brand2: channel("brand2"),
        brand3: channel("brand3"),
        ink: channel("ink"),
      },
      fontFamily: {
        display: ["var(--font-display)", "ui-rounded", "system-ui", "sans-serif"],
        sans: ["var(--font-body)", "system-ui", "sans-serif"],
      },
      boxShadow: {
        glow: "0 10px 40px -10px rgb(var(--brand) / 0.55)",
        sticker: "0 5px 0 0 rgb(var(--ink) / 0.12)",
        pop: "0 14px 34px -14px rgb(var(--ink) / 0.35)",
      },
      keyframes: {
        float: { "0%,100%": { transform: "translateY(0) rotate(-2deg)" }, "50%": { transform: "translateY(-14px) rotate(2deg)" } },
        floatSlow: { "0%,100%": { transform: "translate(0,0) scale(1)" }, "50%": { transform: "translate(30px,-24px) scale(1.08)" } },
        wiggle: { "0%,100%": { transform: "rotate(-6deg)" }, "50%": { transform: "rotate(6deg)" } },
        pop: { "0%": { transform: "scale(.6)", opacity: "0" }, "70%": { transform: "scale(1.08)", opacity: "1" }, "100%": { transform: "scale(1)" } },
        fadeUp: { "0%": { opacity: "0", transform: "translateY(18px)" }, "100%": { opacity: "1", transform: "translateY(0)" } },
        fadeIn: { "0%": { opacity: "0" }, "100%": { opacity: "1" } },
        slideIn: { "0%": { opacity: "0", transform: "translateX(-16px)" }, "100%": { opacity: "1", transform: "translateX(0)" } },
        shimmer: { "0%": { transform: "translateX(-120%)" }, "100%": { transform: "translateX(320%)" } },
        pulseRing: { "0%": { transform: "scale(.9)", opacity: ".7" }, "100%": { transform: "scale(1.9)", opacity: "0" } },
        flame: { "0%,100%": { transform: "scale(1) rotate(-3deg)" }, "33%": { transform: "scale(1.12,.94) rotate(3deg)" }, "66%": { transform: "scale(.95,1.08) rotate(-2deg)" } },
        twinkle: { "0%,100%": { opacity: ".25", transform: "scale(.7) rotate(0deg)" }, "50%": { opacity: "1", transform: "scale(1.15) rotate(25deg)" } },
        blink: { "0%,92%,100%": { transform: "scaleY(1)" }, "96%": { transform: "scaleY(.08)" } },
        bounceSoft: { "0%,100%": { transform: "translateY(0)" }, "50%": { transform: "translateY(-6px)" } },
        spinSlow: { to: { transform: "rotate(360deg)" } },
        zoomIn: { "0%": { opacity: "0", transform: "scale(.7) translateY(20px)" }, "100%": { opacity: "1", transform: "scale(1) translateY(0)" } },
        wave: { "0%,60%,100%": { transform: "rotate(0)" }, "10%,30%": { transform: "rotate(16deg)" }, "20%,40%": { transform: "rotate(-8deg)" }, "50%": { transform: "rotate(10deg)" } },
        shake: { "0%,100%": { transform: "translateX(0)" }, "20%,60%": { transform: "translateX(-7px)" }, "40%,80%": { transform: "translateX(7px)" } },
        // "Stuck? Ask me!" pops up for a few seconds, then hides, so it never gets in the way for long.
        novaBubble: { "0%,62%,100%": { opacity: "0", transform: "translateY(8px) scale(.8)" }, "6%,52%": { opacity: "1", transform: "translateY(0) scale(1)" } },
        checkPop: { "0%": { transform: "scale(0) rotate(-40deg)" }, "60%": { transform: "scale(1.3) rotate(8deg)" }, "100%": { transform: "scale(1) rotate(0)" } },
      },
      animation: {
        float: "float 6s ease-in-out infinite",
        "float-slow": "floatSlow 14s ease-in-out infinite",
        wiggle: "wiggle 1.2s ease-in-out infinite",
        pop: "pop .5s cubic-bezier(.3,1.4,.5,1) both",
        "fade-up": "fadeUp .6s cubic-bezier(.2,.8,.2,1) both",
        "fade-in": "fadeIn .5s ease both",
        "slide-in": "slideIn .5s cubic-bezier(.2,.8,.2,1) both",
        shimmer: "shimmer 2.6s ease-in-out infinite",
        "pulse-ring": "pulseRing 1.8s ease-out infinite",
        flame: "flame 1.4s ease-in-out infinite",
        twinkle: "twinkle 2.8s ease-in-out infinite",
        blink: "blink 5s infinite",
        "bounce-soft": "bounceSoft 2.4s ease-in-out infinite",
        "spin-slow": "spinSlow 24s linear infinite",
        "zoom-in": "zoomIn .55s cubic-bezier(.3,1.3,.5,1) both",
        wave: "wave 2.6s ease-in-out infinite",
        shake: "shake .45s ease both",
        "nova-bubble": "novaBubble 12s ease-in-out infinite",
        "check-pop": "checkPop .45s cubic-bezier(.3,1.5,.5,1) both",
      },
    },
  },
  plugins: [],
} satisfies Config;
