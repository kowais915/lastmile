import { auth } from "@clerk/nextjs/server";
import Link from "next/link";
import { redirect } from "next/navigation";

import { ensureWorkspaceMember, getVolunteerTasks, getWorkspace } from "@/lib/db";

export default async function VolunteerPage() {
  const { orgId, userId } = await auth();
  if (!orgId || !userId) redirect("/sign-in");
  const workspace = await getWorkspace(orgId);
  if (!workspace) redirect("/onboarding");
  const role = await ensureWorkspaceMember(workspace.id, userId);
  if (role !== "volunteer") redirect("/portal");
  const tasks = await getVolunteerTasks(workspace.id);

  return <main className="min-h-screen bg-[#f7f6f2] px-6 py-12 text-[#18231e]"><div className="mx-auto max-w-3xl"><p className="text-xs font-bold tracking-[0.2em] text-[#5b8265]">{workspace.name.toUpperCase()}</p><h1 className="mt-2 text-3xl font-semibold tracking-tight">Volunteer handoffs</h1><p className="mt-3 text-[#68776d]">Your team&apos;s live pickup tasks are listed below.</p><div className="mt-8 space-y-3">{tasks.length ? tasks.map((task) => <article key={task.id} className="rounded-2xl border border-[#e2e2d9] bg-white p-5"><p className="font-semibold">{task.partnerName}</p><p className="mt-1 text-sm text-[#68776d]">{task.portions} meals · {task.status}</p></article>) : <div className="rounded-2xl border border-dashed border-[#cfd8d0] bg-white p-8 text-center text-[#68776d]">No pickup tasks have been dispatched yet.</div>}</div><Link href="/portal" className="mt-8 inline-block font-semibold text-[#285d3c]">Refresh my workspace →</Link></div></main>;
}
