import { AnimatedNumber } from "./AnimatedNumber";

export function StatCard({ label, value, detail, emoji, number, suffix }: { label: string; value?: string; detail?: string; emoji?: string; number?: number; suffix?: string }) {
  return <div className="card card-hover p-5">
    <div className="flex items-center justify-between"><p className="text-sm font-semibold text-ink/55">{label}</p>{emoji && <span className="text-2xl">{emoji}</span>}</div>
    <p className="mt-3 font-display text-3xl font-extrabold tracking-tight">{number !== undefined ? <AnimatedNumber value={number} suffix={suffix} /> : value}</p>
    {detail && <p className="mt-1 text-xs text-ink/50">{detail}</p>}
  </div>;
}
