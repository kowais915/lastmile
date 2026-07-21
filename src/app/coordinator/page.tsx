import { auth } from "@clerk/nextjs/server";
import Link from "next/link";
import { redirect } from "next/navigation";

import { OperationsMap } from "@/components/operations-map";
import { SignOutControl } from "@/components/sign-out-control";
import { SubmitButton } from "@/components/submit-button";
import { getCoordinatorDashboard, getWorkspace } from "@/lib/db";

import { dispatchAllocationPlan } from "./actions";

function deadline(value: string) {
  return new Intl.DateTimeFormat("en", { dateStyle: "medium", timeStyle: "short" }).format(new Date(value));
}

export default async function CoordinatorPage() {
  const { orgId } = await auth();
  if (!orgId) redirect("/onboarding");
  const workspace = await getWorkspace(orgId);
  if (!workspace) redirect("/onboarding");

  const board = await getCoordinatorDashboard(workspace.id);
  const totalTasks = Object.values(board.taskCounts).reduce((total, count) => total + count, 0);

  return <main className="min-h-screen bg-[#f7f6f2] text-[#18231e]">
    <header className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 px-6 py-7">
      <div><p className="text-xs font-bold tracking-[0.2em] text-[#5b8265]">{workspace.name.toUpperCase()}</p><h1 className="mt-2 text-3xl font-semibold tracking-tight">Last Mile command board</h1></div>
      <nav className="flex flex-wrap gap-3 text-sm font-semibold"><Link href="/donate" className="rounded-xl border border-[#cfd8d0] bg-white px-4 py-2.5 text-[#285d3c]">List food</Link><Link href="/team" className="rounded-xl border border-[#cfd8d0] bg-white px-4 py-2.5 text-[#285d3c]">Team access</Link><Link href="/review" className="rounded-xl bg-[#183d2a] px-4 py-2.5 text-white">Review queue</Link><SignOutControl /></nav>
    </header>

    <div className="mx-auto max-w-6xl px-6 pb-14">
      <section className="rounded-[2rem] bg-[#183d2a] p-7 text-white sm:p-9"><div className="flex flex-wrap items-end justify-between gap-6"><div><p className="text-xs font-bold tracking-[0.2em] text-[#b6d59a]">LIVE OPERATIONS</p><h2 className="mt-3 max-w-2xl text-3xl font-semibold">Review the recommendation. Then put people in motion.</h2><p className="mt-3 max-w-xl text-sm leading-6 text-[#c9d8cd]">The allocation engine produces a transparent draft; dispatch happens only when a coordinator confirms it.</p></div><div className="flex gap-7 text-right"><div><p className="text-2xl font-bold">{board.pendingSubmissionCount}</p><p className="text-sm text-[#b9cbbd]">donors to review</p></div><div><p className="text-2xl font-bold">{board.draftPlans.length}</p><p className="text-sm text-[#b9cbbd]">plans to review</p></div><div><p className="text-2xl font-bold">{totalTasks}</p><p className="text-sm text-[#b9cbbd]">live handoffs</p></div></div></div></section>

      <section className="mt-7 rounded-[1.75rem] border border-[#e5e2d9] bg-white p-6 shadow-sm"><div className="flex flex-wrap items-end justify-between gap-4"><div><p className="text-xs font-bold tracking-[0.16em] text-[#65806b]">DONOR REVIEW SNEAK PEEK</p><h2 className="mt-2 text-2xl font-semibold">Incoming food that needs a decision</h2><p className="mt-2 text-sm text-[#68776d]">The earliest-expiring listings are surfaced first. Approval and allocation stay in the full review queue.</p></div><Link href="/review" className="rounded-xl border border-[#cfd8d0] bg-white px-4 py-2.5 text-sm font-bold text-[#285d3c]">Open all {board.pendingSubmissionCount} listings →</Link></div><div className="mt-6 grid gap-4 md:grid-cols-3">{board.pendingSubmissions.length ? board.pendingSubmissions.map((submission) => <article key={submission.id} className="rounded-2xl border border-[#e5e2d9] bg-[#f8faf6] p-5"><div className="flex items-start justify-between gap-3"><p className="font-semibold">{submission.itemName}</p><span className="rounded-full bg-[#f8ead6] px-2.5 py-1 text-xs font-bold text-[#8a631a]">Pending</span></div><p className="mt-2 text-sm text-[#68776d]">{submission.portions} meals · from {submission.donorName}</p><p className="mt-5 text-xs font-bold tracking-[0.12em] text-[#65806b]">EXPIRES</p><p className="mt-1 text-sm font-semibold">{deadline(submission.expiresAt)}</p><p className="mt-1 text-xs text-[#68776d]">Collection closes {deadline(submission.collectionWindowEnd)}</p><Link href="/review" className="mt-5 inline-block text-sm font-bold text-[#285d3c]">Review this listing →</Link></article>) : <div className="rounded-2xl border border-dashed border-[#cfd8d0] px-6 py-8 text-center text-sm text-[#68776d] md:col-span-3">No donation submissions are waiting for review. Share the public donor form when you are ready for more supply.</div>}</div></section>

      <section className="mt-7 grid gap-6 lg:grid-cols-[1.35fr_.65fr]"><div className="space-y-5"><div className="rounded-[1.75rem] border border-[#e5e2d9] bg-white p-6 shadow-sm"><div className="flex items-center justify-between gap-3"><div><p className="text-xs font-bold tracking-[0.16em] text-[#65806b]">DRAFT ALLOCATIONS</p><h2 className="mt-2 text-2xl font-semibold">Recommended next moves</h2></div><Link href="/review" className="text-sm font-bold text-[#285d3c]">Review donors →</Link></div><div className="mt-6 max-h-[44rem] space-y-4 overflow-y-auto pr-2">{board.draftPlans.length ? board.draftPlans.map((plan) => <article key={plan.id} className="rounded-2xl border border-[#e5e2d9] p-5"><div className="flex flex-wrap justify-between gap-3"><div><p className="font-semibold">{plan.itemName} · {plan.availablePortions} meals</p><p className="mt-1 text-sm text-[#68776d]">From {plan.donorName} · expires {deadline(plan.expiresAt)}</p></div><form action={dispatchAllocationPlan}><input type="hidden" name="planId" value={plan.id} /><SubmitButton disabled={!plan.allocations.length} pendingChildren="Dispatching pickups…" className="rounded-xl bg-[#183d2a] px-4 py-2.5 text-sm font-bold text-white disabled:cursor-not-allowed disabled:bg-[#8ba592]">{plan.allocations.length ? "Confirm & dispatch" : "No eligible partner"}</SubmitButton></form></div><div className="mt-4 space-y-2">{plan.allocations.map((allocation) => <div key={`${plan.id}-${allocation.partner}`} className="flex items-center justify-between rounded-xl bg-[#f4f7f1] px-4 py-3 text-sm"><span><b>{allocation.partner}</b><span className="ml-2 text-[#68776d]">score {Math.round(Number(allocation.score))}</span></span><b>{allocation.portions} meals</b></div>)}</div></article>) : <div className="rounded-2xl border border-dashed border-[#cfd8d0] p-7 text-center text-sm text-[#68776d]">Nothing awaiting a dispatch decision. New reviewed donor listings will appear here.</div>}</div></div></div><aside className="rounded-[1.75rem] border border-[#e5e2d9] bg-white p-6 shadow-sm"><p className="text-xs font-bold tracking-[0.16em] text-[#65806b]">HANDOFF STATUS</p><h2 className="mt-2 text-2xl font-semibold">What&apos;s moving</h2><div className="mt-6 space-y-3">{["unclaimed", "claimed", "collected", "delivered"].map((status) => <div key={status} className="flex items-center justify-between rounded-xl bg-[#f5f7f2] px-4 py-3"><span className="capitalize text-sm font-semibold">{status}</span><b>{board.taskCounts[status] ?? 0}</b></div>)}</div><p className="mt-6 text-sm leading-6 text-[#68776d]">Volunteers only see unclaimed tasks and the tasks they own. Each transition is saved to Neon.</p></aside></section>

      <div className="mt-7"><OperationsMap routes={board.mapRoutes} title="Active pickup coverage" /></div>
    </div>
  </main>;
}
