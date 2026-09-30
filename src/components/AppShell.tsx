"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { createContext, FormEvent, useContext, useState } from "react";
import { BookOpen, Clock3, Compass, GraduationCap, Home, Menu, Sparkles, X } from "lucide-react";
import type { Role } from "@/domain/types";

const nav = [{ href: "/home", label: "Home", icon: Home }, { href: "/journey", label: "Skill Adventure", icon: Compass }, { href: "/dreams", label: "Dream Board", icon: GraduationCap }, { href: "/quests", label: "Quests", icon: Sparkles }, { href: "/time", label: "Updates & Time", icon: Clock3 }];
const RoleContext = createContext<Role>("learner");
export const useRole = () => useContext(RoleContext);

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [role, setRole] = useState<Role>("learner");
  const [open, setOpen] = useState(false);
  const [showPin, setShowPin] = useState(false);
  const [pin, setPin] = useState("");
  const [pinError, setPinError] = useState("");
  const requestMentor = (event: FormEvent) => {
    event.preventDefault();
    if (pin === "2468") { setRole("mentor"); setShowPin(false); setPin(""); setPinError(""); }
    else setPinError("That code didn’t work. Try again.");
  };
  return <div className="min-h-screen bg-[#fffaf5] text-slate-900">
    <aside className={`${open ? "translate-x-0" : "-translate-x-full"} fixed inset-y-0 left-0 z-30 w-72 border-r border-slate-200 bg-white p-6 transition-transform lg:translate-x-0`}>
      <div className="flex items-center justify-between"><Link href="/home" className="text-lg font-semibold">My Future World</Link><button className="lg:hidden" onClick={() => setOpen(false)} aria-label="Close menu"><X size={20}/></button></div>
      <p className="mt-2 text-sm text-slate-500">{role === "learner" ? "Hanifa’s space" : "Mentor Mode"}</p>
      <nav className="mt-10 space-y-2">{nav.map(({ href, label, icon: Icon }) => <Link key={href} onClick={() => setOpen(false)} href={href} className={`flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-medium ${pathname.startsWith(href) ? "bg-fuchsia-50 text-fuchsia-800" : "text-slate-600 hover:bg-slate-50"}`}><Icon size={18}/>{label}</Link>)}</nav>
      <div className="mt-10 rounded-2xl bg-slate-50 p-4"><p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Your space</p><button onClick={() => { setRole("learner"); setShowPin(false); }} className={`mt-3 w-full rounded-xl px-3 py-2 text-left text-xs ${role === "learner" ? "bg-white font-semibold shadow-sm" : "text-slate-500"}`}>🌸 Hanifa</button>{role === "mentor" ? <button onClick={() => setShowPin(false)} className="mt-2 w-full rounded-xl bg-white px-3 py-2 text-left text-xs font-semibold shadow-sm">🔒 Mentor · signed in</button> : <button onClick={() => setShowPin(true)} className="mt-2 w-full rounded-xl px-3 py-2 text-left text-xs text-slate-600">🔐 Mentor sign in</button>}{showPin && <form onSubmit={requestMentor} className="mt-3 space-y-2"><label className="text-xs text-slate-600" htmlFor="mentor-pin">Enter Mentor access code</label><input id="mentor-pin" autoComplete="off" inputMode="numeric" maxLength={4} value={pin} onChange={e => setPin(e.target.value)} className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm" placeholder="4-digit code"/><button className="w-full rounded-xl bg-slate-900 px-3 py-2 text-xs font-semibold text-white">Unlock Mentor</button>{pinError && <p role="alert" className="text-xs text-rose-600">{pinError}</p>}<p className="text-[10px] leading-4 text-slate-400">Local preview code only. Production needs real sign-in.</p></form>}</div>
      {role === "mentor" && <Link href="/mentor" className="mt-4 flex items-center gap-3 rounded-2xl border border-slate-200 px-4 py-3 text-sm font-medium"><BookOpen size={18}/>Mentor review</Link>}
    </aside>
    <RoleContext.Provider value={role}><div className="lg:pl-72"><header className="sticky top-0 z-20 flex items-center justify-between border-b border-slate-200/70 bg-[#fffaf5]/90 px-5 py-4 backdrop-blur lg:px-10"><button onClick={() => setOpen(true)} className="lg:hidden" aria-label="Open menu"><Menu size={22}/></button><div className="lg:hidden text-sm font-semibold">My Future World</div><div className="ml-auto flex items-center gap-3"><span className="hidden text-sm text-slate-500 sm:inline">{role === "learner" ? "Good morning, Hanifa" : "Mentor overview"}</span><div className="grid h-9 w-9 place-items-center rounded-full bg-fuchsia-100 text-sm font-semibold text-fuchsia-800">{role === "learner" ? "H" : "M"}</div></div></header><main className="mx-auto max-w-6xl px-5 py-8 lg:px-10">{children}</main></div></RoleContext.Provider>
  </div>;
}
