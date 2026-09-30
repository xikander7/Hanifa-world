"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { createContext, FormEvent, useContext, useEffect, useState } from "react";
import { BookOpen, Brain, Cloud, CloudOff, Compass, FileSpreadsheet, Flame, GraduationCap, HelpCircle, Home, Lock, Menu, MessageCircleQuestion, NotebookPen, ShieldCheck, Target, Timer, Volume2, VolumeX, X, Zap } from "lucide-react";
import type { Role } from "@/domain/types";
import { KEYS, NOT_SEEN } from "@/lib/data";
import { seedSheetEntries } from "@/lib/sheetSeed";
import { syncFromLiveSheet, syncIsDue } from "@/lib/liveSheet";
import { STORE_ERROR_EVENT } from "@/lib/store";
import { cloudUrl, isCloudUrl, mentorSignIn, mentorSignOut, mentorToken, setCloudUrl, startCloud, useCloudStatus } from "@/lib/cloud";
import { finishFocus, useFocusTimer } from "@/lib/useFocus";
import { useGame } from "@/lib/useGame";
import { useHydrated, useLocalStore } from "@/lib/store";
import { CelebrateProvider, useCelebrate } from "./Celebrate";
import { Nova } from "./Nova";
import { ProgressBar } from "./ProgressBar";
import { useNow } from "@/lib/useNow";

// "How to use this app" comes first so it's the obvious place to start. `short` is the label in the phone's bottom bar.
const guideItem = { href: "/guide", label: "How to use this app", short: "Help", icon: BookOpen };
const learnerNav = [
  { href: "/home", label: "Home", short: "Home", icon: Home }, { href: "/adventure", label: "Adventure", short: "Map", icon: Compass }, { href: "/learn", label: "Learn", short: "Learn", icon: Brain },
  { href: "/ask", label: "Ask a Helper", short: "Ask", icon: MessageCircleQuestion },
  { href: "/quests", label: "Missions", short: "Missions", icon: Target }, { href: "/time", label: "Journal", short: "Journal", icon: NotebookPen }, { href: "/dreams", label: "Dreams", short: "Dreams", icon: GraduationCap },
];
const sheetItem = { href: "/sheet", label: "Working Excel Sheet", short: "Sheet", icon: FileSpreadsheet };
const mentorItem = { href: "/mentor", label: "Mentor Hub", short: "Mentor", icon: ShieldCheck };

const VIBES = [
  { id: "bloom", label: "Bloom", from: "#ec4899", to: "#a855f7" }, { id: "ocean", label: "Ocean", from: "#0ea5e9", to: "#6366f1" },
  { id: "sunset", label: "Sunset", from: "#f97316", to: "#f43f5e" }, { id: "forest", label: "Forest", from: "#10b981", to: "#0d9488" },
];

const RoleContext = createContext<Role>("learner");
export const useRole = () => useContext(RoleContext);

const greeting = () => { const h = new Date().getHours(); return h < 5 ? "Still up" : h < 12 ? "Good morning" : h < 18 ? "Good afternoon" : "Good evening"; };

/** Celebrates level-ups and new badges, and saves finished focus sessions, wherever Hanifa is in the app. */
function Watchers({ role }: { role: Role }) {
  const { celebrate, levelUp } = useCelebrate();
  const game = useGame();
  const hydrated = useHydrated();
  const [seen, setSeen] = useLocalStore(KEYS.seenGame, NOT_SEEN);
  const { timer } = useFocusTimer();
  const now = useNow(1000, Boolean(timer));
  const earnedKey = game.earnedBadges.map(b => b.id).join(",");

  useEffect(() => { if (hydrated) seedSheetEntries(); }, [hydrated]);

  // Cloud save. A "?cloud=" link from Mentor Hub connects this device to it.
  useEffect(() => {
    if (!hydrated) return;
    const url = new URL(window.location.href), link = url.searchParams.get("cloud");
    if (link !== null) {
      if (isCloudUrl(link)) { setCloudUrl(link); celebrate({ emoji: "☁️", title: "Cloud save is on", text: "This device now shares progress with your other devices.", sound: "win" }); }
      url.searchParams.delete("cloud");
      window.history.replaceState(null, "", url.pathname + url.search + url.hash);
    }
    return startCloud();
  }, [hydrated, celebrate]);

  // Keep the journal in step with the Google Sheet: read it when the app opens and whenever the tab comes back into view.
  useEffect(() => {
    if (!hydrated) return;
    let busy = false;
    const sync = async () => {
      if (busy || !syncIsDue() || document.visibilityState === "hidden") return;
      busy = true;
      try {
        const { added, updated } = await syncFromLiveSheet();
        if (added) celebrate({ emoji: "📊", title: `${added} new ${added === 1 ? "entry" : "entries"} from the sheet`, text: "Your Excel sheet is synced to the Journal.", sound: "pop" });
        else if (updated) celebrate({ emoji: "🔄", title: "Sheet synced", text: `${updated} ${updated === 1 ? "entry" : "entries"} updated from the sheet.`, confetti: false, sound: "pop" });
      } catch { /* offline or sheet unreachable: the Working Excel Sheet page shows the error when synced by hand */ }
      finally { busy = false; }
    };
    sync();
    document.addEventListener("visibilitychange", sync);
    return () => document.removeEventListener("visibilitychange", sync);
  }, [hydrated, celebrate]);

  useEffect(() => {
    const warn = () => celebrate({ emoji: "⚠️", title: "Couldn't save that", text: "This browser's storage is full. Remove a few screenshots from old journal entries, then try again.", confetti: false, sound: "pop" });
    window.addEventListener(STORE_ERROR_EVENT, warn);
    return () => window.removeEventListener(STORE_ERROR_EVENT, warn);
  }, [celebrate]);

  useEffect(() => {
    if (!hydrated || role !== "learner") return;
    const earned = game.earnedBadges;
    if (!seen.init) { setSeen({ init: true, level: game.level, badges: earned.map(b => b.id) }); return; }
    const fresh = earned.filter(b => !seen.badges.includes(b.id));
    if (game.level > seen.level) levelUp(game.level, game.rank.title, game.rank.emoji);
    else if (fresh.length) celebrate({ emoji: fresh[0].emoji, title: `Badge unlocked: ${fresh[0].name}`, text: fresh[0].hint, sound: "win" });
    if (game.level !== seen.level || fresh.length || earned.length !== seen.badges.length) setSeen({ init: true, level: game.level, badges: earned.map(b => b.id) });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hydrated, role, game.level, earnedKey, seen.init]);

  useEffect(() => {
    if (timer && now >= timer.endsAt) {
      const minutes = finishFocus();
      if (minutes) celebrate({ emoji: "⏱️", title: `${minutes} focused minutes saved!`, text: "Take a stretch. You earned it.", xp: minutes, sound: "chime" });
    }
  }, [now, timer, celebrate]);
  return null;
}

function FocusPill() {
  const { timer } = useFocusTimer();
  const now = useNow(1000, Boolean(timer));
  if (!timer) return null;
  const left = Math.max(0, Math.round((timer.endsAt - now) / 1000));
  return <Link href="/home" className="animate-pop flex items-center gap-2 rounded-full bg-ink px-3.5 py-2 text-xs font-bold text-white shadow-pop">
    <span className="relative flex h-2.5 w-2.5"><span className="absolute inline-flex h-full w-full rounded-full bg-brand animate-pulse-ring" /><span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-brand" /></span>
    <Timer size={14} /><span className="tabular-nums">{String(Math.floor(left / 60)).padStart(2, "0")}:{String(left % 60).padStart(2, "0")}</span>
  </Link>;
}

/**
 * Without Cloud save there's no server to ask, so the PIN is checked against a salted hash: it isn't written anywhere in
 * the app. (A 4-digit code can't be truly secret in the browser; with Cloud save on, the web app checks it instead.)
 */
const PIN_HASH = "removed";
async function pinMatches(pin: string) {
  try {
    const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(`my-future-world-mentor:${pin}`));
    return [...new Uint8Array(digest)].map(b => b.toString(16).padStart(2, "0")).join("") === PIN_HASH;
  } catch { return false; }
}

function CloudPill() {
  const cloud = useCloudStatus();
  if (cloud.state === "off") return null;
  const ok = cloud.state === "synced" || cloud.state === "syncing";
  const label = cloud.state === "syncing" ? "Saving…" : cloud.state === "synced" ? (cloud.refused ? "Saved, but some Mentor changes were undone" : "Saved to the cloud") : cloud.state === "offline" ? "Offline: your work is kept on this device and saves when you're back online" : `Cloud save problem: ${cloud.message ?? "try again later"}`;
  return <span title={label} aria-label={label} className={`grid h-9 w-9 place-items-center rounded-full ring-1 ring-ink/5 ${ok ? "bg-white/80 text-emerald-600" : "bg-amber-100 text-amber-700"}`}>
    {ok ? <Cloud size={16} className={cloud.state === "syncing" ? "animate-pulse" : ""} /> : <CloudOff size={16} />}
  </span>;
}

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [role, setRole] = useState<Role>("learner");
  const [open, setOpen] = useState(false);
  const [showPin, setShowPin] = useState(false);
  const [pin, setPin] = useState("");
  const [pinError, setPinError] = useState("");
  const [vibe, setVibe] = useLocalStore<string>(KEYS.vibe, "bloom");
  const [sound, setSound] = useLocalStore<string>(KEYS.sound, "off");
  const [guideSeen] = useLocalStore<string>(KEYS.guideSeen, "");
  const game = useGame();
  const hydrated = useHydrated();

  // With Cloud save, Mentor mode needs the sign-in token the web app gave this device.
  useEffect(() => { try { if (sessionStorage.getItem(KEYS.role) === "mentor" && (!cloudUrl() || mentorToken())) setRole("mentor"); } catch { /* ignore */ } }, []);
  useEffect(() => { document.documentElement.dataset.vibe = vibe; }, [vibe]);
  useEffect(() => { setOpen(false); }, [pathname]);

  const switchRole = (next: Role) => { setRole(next); try { sessionStorage.setItem(KEYS.role, next); } catch { /* ignore */ } };
  const [checking, setChecking] = useState(false);
  const requestMentor = async (event: FormEvent) => {
    event.preventDefault();
    setChecking(true);
    const error = cloudUrl() ? await mentorSignIn(pin) : (await pinMatches(pin)) ? "" : "That code didn’t work. Try again.";
    setChecking(false);
    if (!error) { switchRole("mentor"); setShowPin(false); setPin(""); setPinError(""); }
    else setPinError(error);
  };
  const becomeHanifa = async () => { if (role === "mentor") { switchRole("learner"); await mentorSignOut(); } setShowPin(false); };
  const sideNav = role === "mentor" ? [guideItem, mentorItem, ...learnerNav, sheetItem] : [guideItem, ...learnerNav, sheetItem];
  // Seven learner tabs (including Ask) fill the bar, so Help lives in the top bar's ? button and the side menu.
  const mobileNav = role === "mentor" ? [mentorItem, ...learnerNav] : learnerNav;
  const isActive = (href: string) => pathname === href || pathname.startsWith(`${href}/`);

  const sidebar = <>
    <div className="flex items-center justify-between">
      <Link href="/home" className="flex items-center gap-2.5"><Nova size={38} float={false} /><span className="font-display text-lg font-extrabold leading-tight">My Future<br />World</span></Link>
      <button className="lg:hidden" onClick={() => setOpen(false)} aria-label="Close menu"><X size={22} /></button>
    </div>

    <div className="mt-6 rounded-3xl bg-ink p-4 text-white">
      <div className="flex items-center justify-between text-xs font-bold"><span>{role === "mentor" ? "Hanifa’s level" : "Your level"}</span><span className="text-white/60">{hydrated ? game.xp.toLocaleString() : 0} XP</span></div>
      <p className="mt-1 font-display text-xl font-extrabold">{game.rank.emoji} Lv {game.level} · {game.rank.title}</p>
      <ProgressBar value={hydrated ? game.levelProgress : 0} height="h-2" className="mt-3 !bg-white/15" />
      <p className="mt-2 text-[11px] text-white/60">{game.xpToNext} XP to level {game.level + 1}</p>
    </div>

    <nav className="mt-5 space-y-1" aria-label="Main">
      {sideNav.map(({ href, label, icon: Icon }) => {
        const active = isActive(href);
        return <Link key={href} href={href} className={`group flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-bold transition duration-200 ${active ? "bg-brand text-white shadow-glow" : "text-ink/65 hover:bg-white hover:text-ink"}`}>
          <Icon size={19} className="transition group-hover:scale-110 group-hover:-rotate-6" /><span className="flex-1">{label}</span>
          {href === guideItem.href && !active && hydrated && guideSeen !== "yes" && <span className="rounded-full bg-brand/15 px-2 py-0.5 text-[10px] font-extrabold uppercase tracking-wide text-brand">Start here</span>}
        </Link>;
      })}
    </nav>

    <div className="mt-auto space-y-3 pt-5">
      <div className="rounded-3xl bg-white/70 p-4">
        <p className="text-[11px] font-extrabold uppercase tracking-wider text-ink/45">Make it yours</p>
        <div className="mt-3 flex items-center gap-2">
          {VIBES.map(v => <button key={v.id} onClick={() => setVibe(v.id)} title={v.label} aria-label={`${v.label} theme`} aria-pressed={vibe === v.id}
            className={`h-8 w-8 rounded-full transition hover:scale-110 ${vibe === v.id ? "ring-2 ring-ink ring-offset-2" : ""}`} style={{ background: `linear-gradient(135deg, ${v.from}, ${v.to})` }} />)}
          <button onClick={() => setSound(sound === "on" ? "off" : "on")} aria-label={sound === "on" ? "Turn sounds off" : "Turn sounds on"} className="ml-auto grid h-8 w-8 place-items-center rounded-full bg-ink/5 text-ink/70 transition hover:bg-ink/10">
            {hydrated && sound === "on" ? <Volume2 size={15} /> : <VolumeX size={15} />}
          </button>
        </div>
      </div>
      <div className="rounded-3xl bg-white/70 p-3">
        <button onClick={becomeHanifa} className={`w-full rounded-2xl px-3 py-2 text-left text-xs font-bold ${role === "learner" ? "bg-white shadow-sticker" : "text-ink/55"}`}>🌸 Hanifa</button>
        {role === "mentor"
          ? <p className="mt-1 flex items-center gap-2 rounded-2xl bg-white px-3 py-2 text-xs font-bold shadow-sticker"><ShieldCheck size={14} className="text-brand" />Mentor · signed in</p>
          : <button onClick={() => setShowPin(true)} className="mt-1 flex w-full items-center gap-2 rounded-2xl px-3 py-2 text-left text-xs font-bold text-ink/55"><Lock size={13} />Mentor sign in</button>}
        {showPin && role !== "mentor" && <form onSubmit={requestMentor} className="mt-2 space-y-2 px-1 pb-1">
          <label className="text-xs text-ink/60" htmlFor="mentor-pin">Mentor access code</label>
          <input id="mentor-pin" autoComplete="off" inputMode="numeric" maxLength={4} value={pin} onChange={e => setPin(e.target.value)} className="field !py-2" placeholder="4-digit code" autoFocus />
          <button disabled={checking} className="btn-dark w-full !py-2 text-xs">{checking ? "Checking…" : "Unlock Mentor"}</button>
          {pinError && <p role="alert" className="text-xs text-rose-600">{pinError}</p>}
        </form>}
      </div>
    </div>
  </>;

  return <RoleContext.Provider value={role}><CelebrateProvider>
    <Watchers role={role} />
    {open && <div className="fixed inset-0 z-30 bg-ink/40 backdrop-blur-sm lg:hidden" onClick={() => setOpen(false)} />}
    <aside className={`${open ? "translate-x-0" : "-translate-x-full"} glass fixed inset-y-0 left-0 z-40 flex w-72 flex-col overflow-y-auto border-r border-white p-5 transition-transform duration-300 lg:translate-x-0`}>{sidebar}</aside>

    <div className="lg:pl-72">
      <header className="sticky top-0 z-20 flex items-center gap-3 border-b border-white/70 bg-white/55 px-4 py-3 backdrop-blur-xl lg:px-10">
        <button onClick={() => setOpen(true)} className="grid h-10 w-10 place-items-center rounded-2xl bg-white/80 lg:hidden" aria-label="Open menu"><Menu size={20} /></button>
        <p className="hidden font-display text-lg font-bold sm:block">{role === "learner" ? <>{greeting()}, <span className="text-gradient">Hanifa</span> ✨</> : "Mentor overview"}</p>
        <div className="ml-auto flex items-center gap-2">
          <FocusPill />
          <CloudPill />
          <Link href="/sheet" aria-label="Open the Working Excel Sheet" title="Working Excel Sheet" className="grid h-9 w-9 place-items-center rounded-full bg-white/80 text-ink/70 ring-1 ring-ink/5 transition hover:scale-110 hover:text-brand lg:hidden"><FileSpreadsheet size={17} /></Link>
          <Link href="/guide" aria-label="How to use this app" title="How to use this app" className="grid h-9 w-9 place-items-center rounded-full bg-white/80 text-ink/70 ring-1 ring-ink/5 transition hover:scale-110 hover:text-brand"><HelpCircle size={17} /></Link>
          <span className="chip bg-white/80 text-ink ring-1 ring-ink/5" title="Day streak"><Flame size={14} className={`text-brand ${hydrated && game.streak.current > 0 ? "animate-flame" : ""}`} />{hydrated ? game.streak.current : 0}</span>
          <span className="chip bg-white/80 text-ink ring-1 ring-ink/5" title="Total XP"><Zap size={14} className="text-brand" />{hydrated ? game.xp.toLocaleString() : 0}</span>
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-4 pb-28 pt-7 lg:px-10 lg:pb-12">{children}</main>
    </div>

    <nav aria-label="Main mobile" className="glass fixed inset-x-3 bottom-3 z-30 grid grid-flow-col auto-cols-fr rounded-[1.6rem] p-1.5 shadow-pop lg:hidden">
      {mobileNav.map(({ href, short, icon: Icon }) => {
        const active = isActive(href);
        return <Link key={href} href={href} className={`flex min-w-0 flex-col items-center gap-0.5 rounded-2xl px-0.5 py-2 text-[10px] font-bold transition ${active ? "bg-brand text-white shadow-glow" : "text-ink/55"}`}><Icon size={18} className={active ? "animate-bounce-soft" : ""} /><span className="max-w-full truncate">{short}</span></Link>;
      })}
    </nav>
  </CelebrateProvider></RoleContext.Provider>;
}
