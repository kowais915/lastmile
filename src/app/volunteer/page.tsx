import { auth, currentUser } from "@clerk/nextjs/server";
import Link from "next/link";
import { redirect } from "next/navigation";

import { ensureWorkspaceMember, getVolunteerTasks, getWorkspace } from "@/lib/db";
import { SignOutControl } from "@/components/sign-out-control";

import { updatePickupTask } from "./actions";

export default async function VolunteerPage() {
  const { orgId, userId } = await auth();
  if (!orgId || !userId) redirect("/sign-in");
  const workspace = await getWorkspace(orgId);
  if (!workspace) redirect("/onboarding");
  const user = await currentUser();
  const role = await ensureWorkspaceMember(workspace.id, userId, user?.primaryEmailAddress?.emailAddress);
  if (role !== "volunteer") redirect("/portal");
  const tasks = await getVolunteerTasks(workspace.id, userId);

  return <main className="min-h-screen bg-[#f7f6f2] px-6 py-12 text-[#18231e]"><div className="mx-auto max-w-3xl"><div className="flex justify-end"><SignOutControl /></div><p className="mt-5 text-xs font-bold tracking-[0.2em] text-[#5b8265]">{workspace.name.toUpperCase()}</p><h1 className="mt-2 text-3xl font-semibold tracking-tight">Volunteer handoffs</h1><p className="mt-3 text-[#68776d]">Claim a route, then record each handoff so the coordinator sees the real state.</p><div className="mt-8 space-y-3">{tasks.length ? tasks.map((task) => { const action = task.status === "unclaimed" ? "claim" : task.status === "claimed" ? "collected" : task.status === "collected" ? "delivered" : null; const label = task.status === "unclaimed" ? "Claim pickup" : task.status === "claimed" ? "Mark collected" : task.status === "collected" ? "Confirm delivery" : "Delivered"; return <article key={task.id} className="rounded-2xl border border-[#e2e2d9] bg-white p-5"><div className="flex items-center justify-between gap-3"><p className="font-semibold">{task.partnerName}</p><span className="rounded-full bg-[#edf4e9] px-2.5 py-1 text-xs font-bold capitalize text-[#287047]">{task.status}</span></div><p className="mt-1 text-sm text-[#68776d]">{task.portions} meals{task.volunteerUserId ? " · assigned to you" : " · available to claim"}</p>{action ? <form action={updatePickupTask} className="mt-4"><input type="hidden" name="taskId" value={task.id} /><input type="hidden" name="action" value={action} /><button className="rounded-xl bg-[#183d2a] px-4 py-2.5 text-sm font-bold text-white">{label}</button></form> : null}</article>; }) : <div className="rounded-2xl border border-dashed border-[#cfd8d0] bg-white p-8 text-center text-[#68776d]">No pickup tasks have been dispatched yet.</div>}</div><Link href="/portal" className="mt-8 inline-block font-semibold text-[#285d3c]">Refresh my workspace →</Link></div></main>;
}
