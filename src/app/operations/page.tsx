import { auth } from "@clerk/nextjs/server";
import Link from "next/link";
import { redirect } from "next/navigation";

import { SignOutControl } from "@/components/sign-out-control";
import { getMembershipRole, getOperationsIntelligence, getWorkspace } from "@/lib/db";

const severityStyles = {
  critical: "bg-[#fbe4df] text-[#9e3d27]",
  urgent: "bg-[#fff0d6] text-[#8a631a]",
  elevated: "bg-[#e7effb] text-[#295ea8]",
} as const;

function dateTime(value: string) {
  return new Intl.DateTimeFormat("en", { dateStyle: "medium", timeStyle: "short" }).format(new Date(value));
}

function Metric({ label, value, detail }: { label: string; value: string; detail: string }) {
  return <article className="rounded-2xl border border-[#e5e2d9] bg-white p-5 shadow-sm"><p className="text-xs font-bold tracking-[0.14em] text-[#65806b]">{label}</p><p className="mt-3 text-3xl font-bold tracking-tight text-[#183d2a]">{value}</p><p className="mt-2 text-sm leading-5 text-[#68776d]">{detail}</p></article>;
}

export default async function OperationsPage() {
  const { orgId, userId } = await auth();
  if (!orgId || !userId) redirect("/onboarding");
  const workspace = await getWorkspace(orgId);
  if (!workspace) redirect("/onboarding");
  if (await getMembershipRole(workspace.id, userId) !== "coordinator") redirect("/portal");
  const intelligence = await getOperationsIntelligence(workspace.id);
  const { metrics } = intelligence;

  return <main className="min-h-screen bg-[#f7f6f2] text-[#18231e]">
    <header className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 px-6 py-7"><div><p className="text-xs font-bold tracking-[0.2em] text-[#5b8265]">{workspace.name.toUpperCase()}</p><h1 className="mt-2 text-3xl font-semibold tracking-tight">Rescue operations</h1></div><nav className="flex flex-wrap gap-3 text-sm font-semibold"><Link href="/coordinator" className="rounded-xl border border-[#cfd8d0] bg-white px-4 py-2.5 text-[#285d3c]">Command board</Link><Link href="/review" className="rounded-xl bg-[#183d2a] px-4 py-2.5 text-white">Review queue</Link><SignOutControl /></nav></header>

    <div className="mx-auto max-w-6xl px-6 pb-14">
      <section className="rounded-[2rem] bg-[#183d2a] p-7 text-white sm:p-9"><div className="flex flex-wrap items-end justify-between gap-6"><div><p className="text-xs font-bold tracking-[0.2em] text-[#b6d59a]">OPERATIONS INTELLIGENCE</p><h2 className="mt-3 max-w-2xl text-3xl font-semibold">See risk early. Keep every rescue moving.</h2><p className="mt-3 max-w-xl text-sm leading-6 text-[#c9d8cd]">Live signals are calculated from your intake, allocation, partner capacity, and volunteer handoffs. Coordinators remain in control of every decision.</p></div><div className="rounded-2xl bg-white/10 px-5 py-4 text-right"><p className="text-2xl font-bold">{intelligence.signals.length}</p><p className="mt-1 text-sm text-[#c9d8cd]">signals need attention</p></div></div></section>

      <section className="mt-7 grid gap-4 sm:grid-cols-2 xl:grid-cols-4"><Metric label="MEALS RESCUED" value={String(metrics.mealsRescued)} detail="Delivered to a partner." /><Metric label="BEFORE EXPIRY" value={String(metrics.mealsSavedBeforeExpiry)} detail="Delivered before the safety deadline." /><Metric label="TIME TO DISPATCH" value={metrics.averageDispatchMinutes === null ? "—" : `${metrics.averageDispatchMinutes}m`} detail="Average from donation record to confirmed plan." /><Metric label="ACTIVE COVERAGE" value={`${metrics.activeHandoffs} / ${metrics.activeVolunteers}`} detail="Handoffs moving / volunteers participating." /></section>

      <section className="mt-7 grid gap-6 lg:grid-cols-[1.25fr_.75fr]"><section className="rounded-[1.75rem] border border-[#e5e2d9] bg-white p-6 shadow-sm"><div className="flex flex-wrap items-end justify-between gap-4"><div><p className="text-xs font-bold tracking-[0.16em] text-[#65806b]">AUTOMATED SIGNAL QUEUE</p><h2 className="mt-2 text-2xl font-semibold">What needs a human next</h2><p className="mt-2 text-sm text-[#68776d]">Rules watch expiry windows, unsigned plans, unclaimed pickups, and quiet handoffs.</p></div><span className="rounded-full bg-[#edf4eb] px-3 py-1.5 text-xs font-bold text-[#287047]">Live from Neon</span></div><div className="mt-6 space-y-3">{intelligence.signals.length ? intelligence.signals.map((signal) => <article key={`${signal.title}-${signal.dueAt}`} className="flex flex-col gap-4 rounded-2xl border border-[#e5e2d9] p-4 sm:flex-row sm:items-center sm:justify-between"><div><div className="flex flex-wrap items-center gap-2"><span className={`rounded-full px-2.5 py-1 text-xs font-bold ${severityStyles[signal.severity]}`}>{signal.severity}</span><p className="font-semibold">{signal.title}</p></div><p className="mt-2 text-sm leading-6 text-[#68776d]">{signal.detail}</p><p className="mt-2 text-xs font-semibold text-[#65806b]">Deadline: {dateTime(signal.dueAt)}</p></div><Link href={signal.href} className="shrink-0 rounded-xl bg-[#183d2a] px-4 py-2.5 text-center text-sm font-bold text-white">Take action</Link></article>) : <div className="rounded-2xl border border-dashed border-[#cfd8d0] bg-[#f8faf6] p-7 text-center"><p className="font-semibold">No time-sensitive signals right now.</p><p className="mt-2 text-sm text-[#68776d]">The rules will surface new risk as operations data changes.</p></div>}</div></section>

        <aside className="space-y-6"><section className="rounded-[1.75rem] border border-[#e5e2d9] bg-white p-6 shadow-sm"><p className="text-xs font-bold tracking-[0.16em] text-[#65806b]">AUTOMATION BOUNDARIES</p><h2 className="mt-2 text-2xl font-semibold">Fast, not automatic.</h2><ol className="mt-5 space-y-4 text-sm"><li className="flex gap-3"><span className="grid size-6 shrink-0 place-items-center rounded-full bg-[#183d2a] text-xs font-bold text-white">1</span><span><b>Detect</b><br /><span className="text-[#68776d]">The system monitors windows and handoff status.</span></span></li><li className="flex gap-3"><span className="grid size-6 shrink-0 place-items-center rounded-full bg-[#183d2a] text-xs font-bold text-white">2</span><span><b>Surface</b><br /><span className="text-[#68776d]">Urgent work is routed to the correct operational screen.</span></span></li><li className="flex gap-3"><span className="grid size-6 shrink-0 place-items-center justify-center rounded-full bg-[#183d2a] text-xs font-bold text-white">3</span><span><b>Confirm</b><br /><span className="text-[#68776d]">A coordinator approves allocation and dispatch every time.</span></span></li></ol></section><section className="rounded-[1.75rem] border border-[#e5e2d9] bg-white p-6 shadow-sm"><p className="text-xs font-bold tracking-[0.16em] text-[#65806b]">ON-TIME DELIVERY</p><p className="mt-2 text-3xl font-bold text-[#183d2a]">{metrics.onTimeDeliveryRate === null ? "—" : `${metrics.onTimeDeliveryRate}%`}</p><p className="mt-2 text-sm leading-6 text-[#68776d]">Of delivered handoffs, this share reached a partner before the recorded expiry deadline.</p></section></aside>
      </section>

      <section className="mt-7 rounded-[1.75rem] border border-[#e5e2d9] bg-white p-6 shadow-sm"><div><p className="text-xs font-bold tracking-[0.16em] text-[#65806b]">PARTNER COVERAGE</p><h2 className="mt-2 text-2xl font-semibold">Capacity across the network</h2><p className="mt-2 text-sm text-[#68776d]">Current remaining capacity is a planning signal—not an automatic routing decision.</p></div><div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-3">{intelligence.partnerCapacity.length ? intelligence.partnerCapacity.map((partner) => { const capacity = partner.requestedPortions ? Math.min(100, Math.round((partner.remainingCapacity / partner.requestedPortions) * 100)) : 0; return <article key={partner.name} className="rounded-2xl bg-[#f5f7f2] p-5"><div className="flex items-start justify-between gap-3"><p className="font-semibold">{partner.name}</p><span className="rounded-full bg-white px-2.5 py-1 text-xs font-bold text-[#52675a]">{partner.urgency}</span></div><div className="mt-5 h-2 overflow-hidden rounded-full bg-[#dce6d9]"><div className="h-full rounded-full bg-[#4e8060]" style={{ width: `${capacity}%` }} /></div><div className="mt-3 flex justify-between text-sm"><span className="text-[#68776d]">{partner.remainingCapacity} open</span><b>{partner.requestedPortions} requested</b></div><p className="mt-3 text-xs text-[#68776d]">Available until {dateTime(partner.availableUntil)}</p></article>; }) : <div className="rounded-2xl border border-dashed border-[#cfd8d0] p-6 text-sm text-[#68776d] md:col-span-2 xl:col-span-3">Partner capacity will appear here once partner managers add their current needs.</div>}</div></section>
    </div>
  </main>;
}
