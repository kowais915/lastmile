"use client";

import { Activity, ClipboardCheck, LayoutDashboard, MapPinned, Plus, Users } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

import { SignOutControl } from "@/components/sign-out-control";

const navigation = [
  { href: "/coordinator", label: "Command board", icon: LayoutDashboard },
  { href: "/operations", label: "Operations", icon: Activity },
  { href: "/review", label: "Review queue", icon: ClipboardCheck },
  { href: "/team", label: "Team access", icon: Users },
];

export function CoordinatorSidebar({ workspaceName, pendingReviews }: { workspaceName: string; pendingReviews: number }) {
  const pathname = usePathname();

  return <aside className="fixed inset-y-0 left-0 z-30 hidden w-[272px] border-r border-[#dce4d9] bg-[#fbfcf8] px-4 py-5 lg:flex lg:flex-col">
    <Link href="/coordinator" className="flex items-center gap-3 rounded-2xl px-2 py-2"><span className="grid size-10 place-items-center rounded-2xl bg-[#183d2a] text-lg font-black text-[#eaf2d4] shadow-[0_10px_22px_rgba(24,61,42,.16)]">L</span><span><span className="block text-base font-bold tracking-tight text-[#183d2a]">Last Mile</span><span className="block text-[10px] font-bold tracking-[.18em] text-[#718477]">RESCUE OS</span></span></Link>

    <div className="mt-8"><p className="px-3 text-[10px] font-bold tracking-[.18em] text-[#7a8a7d]">WORKSPACE</p><div className="mt-3 rounded-2xl border border-[#e1e7df] bg-white px-3 py-3"><p className="truncate text-sm font-bold text-[#24372a]">{workspaceName}</p><p className="mt-1 text-xs text-[#718477]">Coordinator workspace</p></div></div>

    <nav className="mt-8 space-y-1" aria-label="Coordinator workspace navigation"><p className="px-3 pb-2 text-[10px] font-bold tracking-[.18em] text-[#7a8a7d]">OPERATE</p>{navigation.map((item) => { const active = pathname === item.href; const Icon = item.icon; return <Link key={item.href} href={item.href} className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold transition ${active ? "bg-[#183d2a] text-white shadow-[0_8px_18px_rgba(24,61,42,.14)]" : "text-[#59705f] hover:bg-[#edf3eb] hover:text-[#183d2a]"}`}><Icon className="size-4" /><span className="flex-1">{item.label}</span>{item.href === "/review" && pendingReviews > 0 ? <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${active ? "bg-white/15 text-[#e6f5d0]" : "bg-[#f8ead6] text-[#8a631a]"}`}>{pendingReviews}</span> : null}</Link>; })}</nav>

    <div className="mt-auto rounded-2xl bg-[#edf3eb] p-4"><div className="flex items-center gap-2 text-[#285d3c]"><MapPinned className="size-4" /><p className="text-xs font-bold tracking-[.14em]">PUBLIC INTAKE</p></div><p className="mt-2 text-sm leading-5 text-[#56705d]">Bring new food into your review queue.</p><Link href="/donate" className="mt-4 inline-flex items-center gap-2 text-sm font-bold text-[#285d3c] hover:text-[#183d2a]"><Plus className="size-4" /> List food</Link></div>
    <div className="mt-4"><SignOutControl /></div>
  </aside>;
}
