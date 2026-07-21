import Link from "next/link";

import { SubmitButton } from "@/components/submit-button";
import { getPublicWorkspaces } from "@/lib/db";

import { createDonationSubmission } from "./actions";

export default async function DonatePage({ searchParams }: { searchParams: Promise<{ sent?: string }> }) {
  const [workspaces, params] = await Promise.all([getPublicWorkspaces(), searchParams]);

  return (
    <main className="min-h-screen bg-[#f7f6f2] px-6 py-8 text-[#18231e] sm:py-12">
      <div className="mx-auto max-w-3xl">
        <Link href="/" className="inline-flex items-center gap-3 font-semibold"><span className="grid size-10 place-items-center rounded-xl bg-[#183d2a] text-lg font-black text-[#e9f3d5]">L</span>Last Mile</Link>
        <section className="mt-10 rounded-[2rem] border border-[#e2e2d9] bg-white p-7 shadow-[0_24px_70px_rgba(24,61,42,0.1)] sm:p-10">
          <p className="text-xs font-bold tracking-[0.2em] text-[#5b8265]">DONATE SURPLUS FOOD</p>
          <h1 className="mt-3 text-3xl font-semibold tracking-tight">Put good food to work today.</h1>
          <p className="mt-3 max-w-2xl leading-7 text-[#68776d]">Tell a local rescue team what&apos;s available. A coordinator will verify the details and arrange the fastest safe handoff.</p>
          {params.sent ? <div className="mt-6 rounded-xl bg-[#eaf5e8] px-4 py-3 text-sm font-semibold text-[#287047]">Thank you—your donation is now with the rescue team for review.</div> : null}
          {workspaces.length === 0 ? <div className="mt-6 rounded-xl bg-[#fff3dc] px-4 py-3 text-sm text-[#805817]">No rescue teams are available yet. Ask a coordinator to create their workspace first.</div> : <form action={createDonationSubmission} className="mt-8 grid gap-5 sm:grid-cols-2">
            <label className="text-sm font-semibold sm:col-span-2">Rescue team<select name="organizationId" required className="mt-2 w-full rounded-xl border border-[#d8ded8] bg-white px-4 py-3"><option value="">Choose a team</option>{workspaces.map((workspace) => <option key={workspace.id} value={workspace.id}>{workspace.name}</option>)}</select></label>
            <label className="text-sm font-semibold">Your name or organization<input name="donorName" required className="mt-2 w-full rounded-xl border border-[#d8ded8] px-4 py-3" /></label>
            <label className="text-sm font-semibold">Email<input name="donorEmail" type="email" required className="mt-2 w-full rounded-xl border border-[#d8ded8] px-4 py-3" /></label>
            <label className="text-sm font-semibold">Phone <span className="font-normal text-[#748078]">optional</span><input name="donorPhone" type="tel" className="mt-2 w-full rounded-xl border border-[#d8ded8] px-4 py-3" /></label>
            <label className="text-sm font-semibold">What are you donating?<input name="itemName" required placeholder="e.g. Prepared vegan meals" className="mt-2 w-full rounded-xl border border-[#d8ded8] px-4 py-3" /></label>
            <label className="text-sm font-semibold">Approximate portions<input name="portions" type="number" min="1" required className="mt-2 w-full rounded-xl border border-[#d8ded8] px-4 py-3" /></label>
            <label className="text-sm font-semibold">Dietary tags <span className="font-normal text-[#748078]">optional</span><input name="dietaryTags" placeholder="vegan, halal, gluten-free" className="mt-2 w-full rounded-xl border border-[#d8ded8] px-4 py-3" /></label>
            <label className="text-sm font-semibold">Collection starts<input name="collectionWindowStart" type="datetime-local" required className="mt-2 w-full rounded-xl border border-[#d8ded8] px-4 py-3" /></label>
            <label className="text-sm font-semibold">Collection ends<input name="collectionWindowEnd" type="datetime-local" required className="mt-2 w-full rounded-xl border border-[#d8ded8] px-4 py-3" /></label>
            <label className="text-sm font-semibold sm:col-span-2">Food expires at<input name="expiresAt" type="datetime-local" required className="mt-2 w-full rounded-xl border border-[#d8ded8] px-4 py-3" /></label>
            <label className="text-sm font-semibold sm:col-span-2">Notes for the coordinator <span className="font-normal text-[#748078]">optional</span><textarea name="notes" rows={3} className="mt-2 w-full rounded-xl border border-[#d8ded8] px-4 py-3" /></label>
            <SubmitButton pendingChildren="Sending donation details…" className="rounded-xl bg-[#183d2a] px-5 py-3.5 text-sm font-bold text-white hover:bg-[#275d42] disabled:cursor-wait disabled:opacity-70 sm:col-span-2">Send donation details</SubmitButton>
          </form>}
        </section>
      </div>
    </main>
  );
}
