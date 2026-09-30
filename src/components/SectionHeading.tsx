export function SectionHeading({ eyebrow, title, copy, children }: { eyebrow?: string; title: string; copy?: string; children?: React.ReactNode }) {
  return <div className="mb-7 flex flex-wrap items-end justify-between gap-4 animate-fade-up">
    <div className="min-w-0">
      {eyebrow && <p className="eyebrow">{eyebrow}</p>}
      <h1 className="mt-1.5 font-display text-3xl font-extrabold tracking-tight sm:text-4xl">{title}</h1>
      {copy && <p className="mt-2 max-w-2xl text-sm leading-6 text-ink/60 sm:text-base">{copy}</p>}
    </div>
    {children}
  </div>;
}
