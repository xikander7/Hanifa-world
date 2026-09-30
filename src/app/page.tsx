import Link from "next/link";

export default function LandingPage() {
  return (
    <main className="min-h-screen bg-[#fffaf5] px-6 py-12 text-slate-900">
      <div className="mx-auto max-w-5xl">
        <p className="mb-4 text-sm font-semibold uppercase tracking-[0.2em] text-fuchsia-700">My Future World</p>
        <h1 className="max-w-2xl text-5xl font-semibold tracking-tight">Build your future, one small quest at a time.</h1>
        <p className="mt-5 max-w-xl text-lg text-slate-600">A warm, focused space for Hanifa’s learning, projects, university goals, scholarships, and mentor feedback.</p>
        <div className="mt-8 flex flex-wrap gap-3">
          <Link className="rounded-full bg-slate-900 px-5 py-3 text-sm font-semibold text-white" href="/home">Open local app</Link>
          <Link className="rounded-full border border-slate-300 bg-white px-5 py-3 text-sm font-semibold" href="/journey">Preview journey</Link>
        </div>
        <div className="mt-16 grid gap-4 md:grid-cols-3">
          {[["🌸", "Home", "Know what matters today."], ["🗺", "Journey", "See the next skill to build."], ["⚡", "Quests", "Turn plans into doable actions."]].map(([icon, title, copy]) => <div key={title} className="rounded-3xl border border-white bg-white/80 p-6 shadow-sm"><span className="text-2xl">{icon}</span><h2 className="mt-4 font-semibold">{title}</h2><p className="mt-2 text-sm text-slate-600">{copy}</p></div>)}
        </div>
      </div>
    </main>
  );
}
