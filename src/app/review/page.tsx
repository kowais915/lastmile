import { auth } from "@clerk/nextjs/server";
import Link from "next/link";
import { redirect } from "next/navigation";

import { getMembershipRole, getPendingSubmissions, getWorkspace } from "@/lib/db";
import { SignOutControl } from "@/components/sign-out-control";
import { SubmitButton } from "@/components/submit-button";

import { approveDonationSubmission } from "./actions";

function dateLabel(value: string) {
  return new Intl.DateTimeFormat("en", { dateStyle: "medium", timeStyle: "short" }).format(new Date(value));
}

export default async function ReviewPage() {
  const { orgId } = await auth();
  if (!orgId) redirect("/onboarding");
  const workspace = await getWorkspace(orgId);
  if (!workspace) redirect("/onboarding");
  const { userId } = await auth();
  if (!userId || await getMembershipRole(workspace.id, userId) !== "coordinator") redirect("/portal");
  const submissions = await getPendingSubmissions(workspace.id);

  return (
    <main className="min-h-screen bg-[#f7f6f2] px-6 py-8 text-[#18231e] sm:py-12">
      <div className="mx-auto max-w-5xl"><div className="flex items-center justify-between gap-4"><Link href="/coordinator" className="font-semibold text-[#285d3c]">← Coordinator board</Link><SignOutControl /></div><div className="mt-8 flex flex-wrap items-end justify-between gap-4"><div><p className="text-xs font-bold tracking-[0.2em] text-[#5b8265]">{workspace.name.toUpperCase()}</p><h1 className="mt-2 text-3xl font-semibold tracking-tight">Donation review queue</h1><p className="mt-2 text-[#68776d]">Approve a listing to generate an explainable draft plan. Dispatch remains a separate decision.</p></div><Link href="/donate" className="rounded-xl bg-[#183d2a] px-4 py-2.5 text-sm font-bold text-white">Open donor form</Link></div><div className="mt-8 space-y-4">{submissions.length === 0 ? <div className="rounded-2xl border border-dashed border-[#cfd8d0] bg-white p-8 text-center text-[#68776d]">No donations are waiting for review. Share the donor form to receive your next listing.</div> : submissions.map((submission) => <article key={submission.id} className="rounded-2xl border border-[#e2e2d9] bg-white p-6 shadow-sm"><div className="flex flex-wrap justify-between gap-5"><div><p className="text-lg font-semibold">{submission.itemName} <span className="text-[#5e6e63]">· {submission.portions} portions</span></p><p className="mt-1 text-sm text-[#68776d]">From {submission.donorName} · {submission.donorEmail}</p><p className="mt-4 text-sm"><b>Collect:</b> {dateLabel(submission.collectionWindowStart)}–{dateLabel(submission.collectionWindowEnd)}<br/><b>Expires:</b> {dateLabel(submission.expiresAt)}</p>{submission.dietaryTags.length ? <p className="mt-3 text-xs font-semibold text-[#287047]">{submission.dietaryTags.join(" · ")}</p> : null}{submission.notes ? <p className="mt-3 text-sm text-[#68776d]">{submission.notes}</p> : null}</div><form action={approveDonationSubmission}><input type="hidden" name="submissionId" value={submission.id} /><SubmitButton pendingChildren="Generating plan…" className="rounded-xl bg-[#183d2a] px-4 py-2.5 text-sm font-bold text-white hover:bg-[#275d42] disabled:cursor-wait disabled:opacity-70">Approve & generate plan</SubmitButton></form></div></article>)}</div></div>
    </main>
  );
}
