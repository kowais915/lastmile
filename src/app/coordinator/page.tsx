import { auth } from "@clerk/nextjs/server";
import { ArrowUpRight, Bell, ClipboardCheck, Route, Users } from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";

import { CoordinatorSidebar } from "@/components/coordinator-sidebar";
import { OperationsMap } from "@/components/operations-map";
import { SubmitButton } from "@/components/submit-button";
import { getCoordinatorDashboard, getWorkspace } from "@/lib/db";

import { dispatchAllocationPlan } from "./actions";

const statusMeta = {
  unclaimed: { label: "Ready to claim", dot: "bg-[#d8962b]" },
  claimed: { label: "Pickup next", dot: "bg-[#4e81c4]" },
  collected: { label: "En route", dot: "bg-[#4e9b64]" },
  delivered: { label: "Delivered", dot: "bg-[#708477]" },
} as const;

function deadline(value: string) {
  return new Intl.DateTimeFormat("en", { dateStyle: "medium", timeStyle: "short" }).format(new Date(value));
}

function StatCard({ label, value, detail, tone }: { label: string; value: number; detail: string; tone: "amber" | "blue" | "green" | "slate" }) {
  const tones = { amber: "bg-[#fff7e8] text-[#8a631a]", blue: "bg-[#eef4fb] text-[#295ea8]", green: "bg-[#edf5ed] text-[#287047]", slate: "bg-[#f2f4f2] text-[#52675a]" };
  return <article className="rounded-2xl border border-[#e1e7df] bg-white p-4 shadow-sm"><div className="flex items-start justify-between gap-3"><p className="text-xs font-bold tracking-[.13em] text-[#6a7e6e]">{label}</p><span className={`size-2.5 rounded-full ${tones[tone]}`} /></div><p className="mt-4 text-3xl font-bold tracking-tight text-[#183d2a] tabular-nums">{value}</p><p className="mt-1 text-xs text-[#718477]">{detail}</p></article>;
}

export default async function CoordinatorPage() {
  const { orgId } = await auth();
  if (!orgId) redirect("/onboarding");
  const workspace = await getWorkspace(orgId);
  if (!workspace) redirect("/onboarding");

  const board = await getCoordinatorDashboard(workspace.id);
  const totalTasks = Object.values(board.taskCounts).reduce((total, count) => total + count, 0);
  const activeHandoffs = (board.taskCounts.claimed ?? 0) + (board.taskCounts.collected ?? 0);

  return <div className="min-h-screen bg-[#f4f6f1] text-[#18231e]"><CoordinatorSidebar workspaceName={workspace.name} pendingReviews={board.pendingSubmissionCount} />
    <main className="min-h-screen lg:pl-[272px]"><div className="mx-auto max-w-[1560px] px-4 py-5 sm:px-6 lg:px-8 lg:py-7">
      <header className="flex flex-wrap items-center justify-between gap-4"><div className="flex items-center gap-3 lg:hidden"><span className="grid size-10 place-items-center rounded-2xl bg-[#183d2a] text-lg font-black text-[#eaf2d4]">L</span><div><p className="text-xs font-bold tracking-[.16em] text-[#5b8265]">{workspace.name.toUpperCase()}</p><h1 className="text-lg font-semibold">Command board</h1></div></div><div className="hidden lg:block"><p className="text-xs font-bold tracking-[.18em] text-[#65806b]">RESCUE CONTROL CENTER</p><h1 className="mt-1 text-3xl font-semibold tracking-tight">Good to see the whole picture.</h1></div><div className="flex items-center gap-2"><Link href="/operations" className="hidden items-center gap-2 rounded-xl border border-[#d5dfd3] bg-white px-3.5 py-2.5 text-sm font-bold text-[#285d3c] shadow-sm transition hover:bg-[#f2f6ed] sm:inline-flex"><Route className="size-4" /> Operations</Link><Link href="/review" className="inline-flex items-center gap-2 rounded-xl bg-[#183d2a] px-4 py-2.5 text-sm font-bold text-white shadow-[0_8px_18px_rgba(24,61,42,.15)] transition hover:bg-[#285d3c]"><ClipboardCheck className="size-4" /> Review queue</Link></div></header>

      <section className="mt-6 rounded-[2rem] bg-[#183d2a] p-6 text-white shadow-[0_22px_55px_rgba(24,61,42,.16)] sm:p-7"><div className="flex flex-col justify-between gap-6 xl:flex-row xl:items-end"><div><p className="text-xs font-bold tracking-[.2em] text-[#b6d59a]">TODAY&apos;S RESCUE DESK</p><h2 className="mt-3 max-w-2xl text-3xl font-semibold tracking-tight sm:text-4xl">Keep every urgent decision moving.</h2><p className="mt-3 max-w-xl text-sm leading-6 text-[#c9d8cd]">Review supply, confirm explainable allocations, and keep the last mile visible from one calm workspace.</p></div><div className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/[.07] px-4 py-3"><Bell className="size-5 text-[#d7ef8a]" /><div><p className="text-sm font-bold">{board.pendingSubmissionCount} items need review</p><p className="mt-0.5 text-xs text-[#b9cbbd]">Your next decisions are prioritized below.</p></div></div></div></section>

      <section className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4"><StatCard label="PENDING REVIEW" value={board.pendingSubmissionCount} detail="Donations awaiting a decision" tone="amber" /><StatCard label="READY TO DISPATCH" value={board.draftPlans.length} detail="Plans awaiting confirmation" tone="blue" /><StatCard label="ACTIVE HANDOFFS" value={activeHandoffs} detail="Claims and trips in progress" tone="green" /><StatCard label="TOTAL HANDOFFS" value={totalTasks} detail="Across this workspace" tone="slate" /></section>

      <section className="mt-5 grid items-start gap-5 xl:grid-cols-[minmax(0,1.35fr)_minmax(350px,.75fr)]"><div className="space-y-5">
        <section className="rounded-[1.75rem] border border-[#e1e7df] bg-white p-5 shadow-sm sm:p-6"><div className="flex flex-wrap items-end justify-between gap-3"><div><p className="text-xs font-bold tracking-[.16em] text-[#65806b]">PRIORITY INTAKE</p><h2 className="mt-1 text-2xl font-semibold tracking-tight">Food waiting for review</h2></div><Link href="/review" className="inline-flex items-center gap-1.5 text-sm font-bold text-[#285d3c]">See full queue <ArrowUpRight className="size-4" /></Link></div><div className="mt-5 max-h-[326px] space-y-2 overflow-y-auto pr-1">{board.pendingSubmissions.length ? board.pendingSubmissions.map((submission) => <article key={submission.id} className="grid gap-4 rounded-2xl border border-[#e5eae3] bg-[#fcfdfb] p-4 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center"><div className="min-w-0"><div className="flex flex-wrap items-center gap-2"><p className="font-semibold text-[#24372a]">{submission.itemName}</p><span className="rounded-full bg-[#f8ead6] px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-[#8a631a]">Pending</span></div><p className="mt-1 text-sm text-[#68776d]">{submission.portions} meals from {submission.donorName}</p><p className="mt-2 text-xs font-semibold text-[#5e7964]">Expires {deadline(submission.expiresAt)} · Collect by {deadline(submission.collectionWindowEnd)}</p></div><Link href="/review" className="rounded-xl border border-[#cbd8cc] bg-white px-3.5 py-2.5 text-center text-sm font-bold text-[#285d3c] transition hover:bg-[#f1f7ed]">Review</Link></article>) : <div className="rounded-2xl border border-dashed border-[#cfd8d0] bg-[#f8faf6] px-5 py-8 text-center text-sm text-[#68776d]">No donor submissions are waiting. New public listings will appear here.</div>}</div></section>

        <section className="rounded-[1.75rem] border border-[#e1e7df] bg-white p-5 shadow-sm sm:p-6"><div className="flex flex-wrap items-end justify-between gap-3"><div><p className="text-xs font-bold tracking-[.16em] text-[#65806b]">ALLOCATION DESK</p><h2 className="mt-1 text-2xl font-semibold tracking-tight">Recommended next moves</h2></div><span className="rounded-full bg-[#edf4eb] px-3 py-1.5 text-xs font-bold text-[#287047]">Human confirmation required</span></div><div className="mt-5 max-h-[430px] space-y-3 overflow-y-auto pr-1">{board.draftPlans.length ? board.draftPlans.map((plan) => <article key={plan.id} className="rounded-2xl border border-[#e5eae3] p-4"><div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between"><div><p className="font-semibold text-[#24372a]">{plan.itemName} <span className="font-normal text-[#68776d]">· {plan.availablePortions} meals</span></p><p className="mt-1 text-sm text-[#68776d]">From {plan.donorName} · expires {deadline(plan.expiresAt)}</p></div><form action={dispatchAllocationPlan} className="shrink-0"><input type="hidden" name="planId" value={plan.id} /><SubmitButton disabled={!plan.allocations.length} pendingChildren="Dispatching…" className="rounded-xl bg-[#183d2a] px-4 py-2.5 text-sm font-bold text-white transition hover:bg-[#285d3c] disabled:cursor-not-allowed disabled:bg-[#8ba592]">{plan.allocations.length ? "Confirm & dispatch" : "No eligible partner"}</SubmitButton></form></div><div className="mt-4 grid gap-2 sm:grid-cols-2">{plan.allocations.map((allocation) => <div key={`${plan.id}-${allocation.partner}`} className="flex items-center justify-between rounded-xl bg-[#f4f7f1] px-3 py-2.5 text-sm"><span className="min-w-0 truncate"><b>{allocation.partner}</b><span className="ml-2 text-xs text-[#68776d]">score {Math.round(Number(allocation.score))}</span></span><b className="ml-3 shrink-0">{allocation.portions}</b></div>)}</div></article>) : <div className="rounded-2xl border border-dashed border-[#cfd8d0] bg-[#f8faf6] p-7 text-center text-sm text-[#68776d]">Nothing awaits a dispatch decision. Reviewed donor listings will appear here as explainable plans.</div>}</div></section>
      </div>

      <aside className="space-y-5 xl:sticky xl:top-5"><section className="rounded-[1.75rem] border border-[#e1e7df] bg-white p-5 shadow-sm sm:p-6"><div className="flex items-end justify-between gap-3"><div><p className="text-xs font-bold tracking-[.16em] text-[#65806b]">HANDOFF HEALTH</p><h2 className="mt-1 text-2xl font-semibold tracking-tight">What&apos;s moving</h2></div><Link href="/team" className="inline-flex items-center gap-1.5 text-sm font-bold text-[#285d3c]"><Users className="size-4" /> Team</Link></div><div className="mt-5 grid grid-cols-2 gap-2">{(Object.keys(statusMeta) as Array<keyof typeof statusMeta>).map((status) => { const meta = statusMeta[status]; return <div key={status} className="rounded-2xl bg-[#f5f7f2] p-3"><div className="flex items-center justify-between gap-2"><span className={`size-2.5 rounded-full ${meta.dot}`} /><b className="text-xl tabular-nums text-[#183d2a]">{board.taskCounts[status] ?? 0}</b></div><p className="mt-3 text-xs font-semibold text-[#52675a]">{meta.label}</p></div>; })}</div><p className="mt-4 text-sm leading-6 text-[#68776d]">Claims and status changes update the operations record immediately.</p></section><OperationsMap routes={board.mapRoutes} networkPoints={board.networkPoints} title="Active pickup coverage" compact /></aside>
      </section>
    </div></main>
  </div>;
}
