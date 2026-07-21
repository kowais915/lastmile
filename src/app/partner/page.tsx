import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";

import { getManagedPartner, getMembershipRole, getWorkspace } from "@/lib/db";
import { SignOutControl } from "@/components/sign-out-control";

import { savePartnerNeed } from "./actions";

export default async function PartnerPage() {
  const { orgId, userId } = await auth();
  if (!orgId || !userId) redirect("/sign-in");
  const workspace = await getWorkspace(orgId);
  if (!workspace || await getMembershipRole(workspace.id, userId) !== "partner_manager") redirect("/portal");
  const partner = await getManagedPartner(workspace.id, userId);
  if (!partner) redirect("/portal");
  const until = partner.need?.availableUntil.slice(0, 16) ?? "";
  return <main className="min-h-screen bg-[#f7f6f2] px-6 py-12 text-[#18231e]"><div className="mx-auto mb-5 flex max-w-4xl justify-end"><SignOutControl /></div><section className="mx-auto grid max-w-4xl gap-6 lg:grid-cols-[.8fr_1.2fr]"><div className="rounded-[2rem] bg-[#183d2a] p-7 text-white"><p className="text-xs font-bold tracking-[0.2em] text-[#b6d59a]">PARTNER WORKSPACE</p><h1 className="mt-3 text-3xl font-semibold">{partner.name}</h1><p className="mt-3 leading-7 text-[#c9d8cd]">Publish the capacity you can safely receive. New donation plans use this information immediately.</p>{partner.serviceArea ? <p className="mt-6 text-sm font-semibold text-[#e9f3d5]">{partner.serviceArea}</p> : null}</div><form action={savePartnerNeed} className="rounded-[2rem] border border-[#e2e2d9] bg-white p-7 shadow-sm"><h2 className="text-xl font-semibold">Today&apos;s receiving need</h2><div className="mt-5 grid gap-4 sm:grid-cols-2"><label className="text-sm font-semibold">Meals needed<input name="requestedPortions" type="number" min="1" required defaultValue={partner.need?.requestedPortions ?? 50} className="mt-1.5 w-full rounded-xl border border-[#d8ded8] px-3 py-2.5" /></label><label className="text-sm font-semibold">Open capacity<input name="remainingCapacity" type="number" min="0" required defaultValue={partner.need?.remainingCapacity ?? 50} className="mt-1.5 w-full rounded-xl border border-[#d8ded8] px-3 py-2.5" /></label><label className="text-sm font-semibold">Urgency<select name="urgency" defaultValue={partner.need?.urgency ?? "elevated"} className="mt-1.5 w-full rounded-xl border border-[#d8ded8] px-3 py-2.5"><option value="routine">Routine</option><option value="elevated">Elevated</option><option value="urgent">Urgent</option><option value="critical">Critical</option></select></label><label className="text-sm font-semibold">Available until<input name="availableUntil" type="datetime-local" required defaultValue={until} className="mt-1.5 w-full rounded-xl border border-[#d8ded8] px-3 py-2.5" /></label></div><label className="mt-4 block text-sm font-semibold">Dietary requirements <span className="font-normal text-[#68776d]">(comma separated)</span><input name="dietaryTags" defaultValue={partner.need?.dietaryTags.join(", ") ?? "vegan"} className="mt-1.5 w-full rounded-xl border border-[#d8ded8] px-4 py-3" /></label><button className="mt-6 w-full rounded-xl bg-[#183d2a] px-4 py-3 text-sm font-bold text-white">Publish receiving capacity</button></form></section></main>;
}
