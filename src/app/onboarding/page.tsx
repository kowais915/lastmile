"use client";

import { useAuth, useClerk, useOrganization, useOrganizationList, useUser } from "@clerk/nextjs";
import { useRouter, useSearchParams } from "next/navigation";
import { FormEvent, Suspense, useState } from "react";

import { finishOnboarding } from "./_actions";

function OnboardingContent() {
  const { createOrganization, setActive } = useClerk();
  const { orgId, orgRole } = useAuth();
  const { organization } = useOrganization();
  const { isLoaded: organizationsLoaded, userInvitations, userMemberships } = useOrganizationList({
    userMemberships: true,
    userInvitations: true,
  });
  const { isLoaded, isSignedIn, user } = useUser();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [workspaceName, setWorkspaceName] = useState("");
  const [timezone, setTimezone] = useState("UTC");
  const [error, setError] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [path, setPath] = useState<"choose" | "create" | "join">("choose");
  const missingWorkspace = searchParams.get("workspace") === "missing";
  const canSetUpActiveOrganization = Boolean(orgId && orgRole === "org:admin");

  function beginWorkspaceSetup() {
    setWorkspaceName(organization?.name ?? "");
    setPath("create");
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setIsSaving(true);

    try {
      const activeOrganization = canSetUpActiveOrganization && orgId
        ? { id: orgId }
        : await createOrganization({ name: workspaceName.trim() });
      await setActive({ organization: activeOrganization.id });
      const result = await finishOnboarding({
        clerkOrganizationId: activeOrganization.id,
        workspaceName,
        timezone,
      });

      if (result.error) {
        setError(result.error);
        return;
      }

      await user?.reload();
      router.replace("/");
      router.refresh();
    } catch {
      setError("We could not create your workspace. Please try again.");
    } finally {
      setIsSaving(false);
    }
  }

  if (!isLoaded) return null;

  if (!isSignedIn) {
    router.replace("/sign-in");
    return null;
  }

  async function selectTeam(organizationId: string) {
    setError("");
    setIsSaving(true);
    try {
      await setActive({ organization: organizationId });
      router.replace("/portal");
      router.refresh();
    } catch {
      setError("We could not open that organization. Please try again.");
      setIsSaving(false);
    }
  }

  async function acceptInvitation(invitation: NonNullable<typeof userInvitations.data>[number]) {
    setError("");
    setIsSaving(true);
    try {
      await invitation.accept();
      await setActive({ organization: invitation.publicOrganizationData.id });
      router.replace("/portal");
      router.refresh();
    } catch {
      setError("We could not accept that invitation. Please use the invitation email or try again.");
      setIsSaving(false);
    }
  }

  return (
    <main className="grid min-h-screen place-items-center bg-[#f7f6f2] px-6 py-12 text-[#18231e]">
      <section className="w-full max-w-xl rounded-[2rem] border border-[#e2e2d9] bg-white p-7 shadow-[0_24px_70px_rgba(24,61,42,0.1)] sm:p-10">
        <div className="flex items-center gap-3"><span className="grid size-10 place-items-center rounded-xl bg-[#183d2a] text-lg font-black text-[#e9f3d5]">L</span><p className="font-semibold">Last Mile</p></div>
        {missingWorkspace && !canSetUpActiveOrganization ? <>
          <p className="mt-8 text-xs font-bold tracking-[0.2em] text-[#5b8265]">WORKSPACE NOT READY</p>
          <h1 className="mt-3 text-3xl font-semibold tracking-tight">This team has not finished setup.</h1>
          <p className="mt-3 leading-7 text-[#68776d]">Ask the organization&apos;s coordinator to finish creating the Last Mile workspace, then open your invitation again. You cannot set up someone else&apos;s team.</p>
          <button onClick={() => { router.replace("/onboarding"); router.refresh(); }} className="mt-8 rounded-xl border border-[#cfd8d0] px-4 py-2.5 text-sm font-bold text-[#285d3c]">Back to onboarding</button>
        </> : null}
        {missingWorkspace && canSetUpActiveOrganization ? <>
          <p className="mt-8 text-xs font-bold tracking-[0.2em] text-[#5b8265]">WORKSPACE SETUP</p>
          <h1 className="mt-3 text-3xl font-semibold tracking-tight">Finish setting up {organization?.name ?? "your organization"}.</h1>
          <p className="mt-3 leading-7 text-[#68776d]">You created this organization in Clerk. Complete its Last Mile workspace now; no second organization will be created.</p>
          <button onClick={beginWorkspaceSetup} className="mt-8 w-full rounded-xl bg-[#183d2a] px-5 py-3.5 text-sm font-bold text-white">Finish workspace setup</button>
        </> : null}
        {!missingWorkspace && path === "choose" ? <>
          <p className="mt-8 text-xs font-bold tracking-[0.2em] text-[#5b8265]">WELCOME TO LAST MILE</p>
          <h1 className="mt-3 text-3xl font-semibold tracking-tight">What brings you here?</h1>
          <p className="mt-3 leading-7 text-[#68776d]">Choose the route that matches how you will help move food where it is needed.</p>
          <div className="mt-8 space-y-4">
            <button onClick={beginWorkspaceSetup} className="w-full rounded-2xl border border-[#d8ded8] p-5 text-left transition hover:border-[#4d8b61] hover:bg-[#f3f8f0]"><p className="font-semibold">I coordinate food rescue</p><p className="mt-1 text-sm leading-6 text-[#68776d]">Create a rescue workspace and invite your team.</p></button>
            <button onClick={() => setPath("join")} className="w-full rounded-2xl border border-[#d8ded8] p-5 text-left transition hover:border-[#4d8b61] hover:bg-[#f3f8f0]"><p className="font-semibold">I&apos;m a partner or volunteer</p><p className="mt-1 text-sm leading-6 text-[#68776d]">Accept your organization invitation, then enter the workspace assigned to you.</p></button>
          </div>
          <p className="mt-6 text-sm text-[#68776d]">Want to donate food? <a className="font-semibold text-[#287047]" href="/donate">Use the public donation form.</a></p>
        </> : null}
        {!missingWorkspace && path === "join" ? <>
          <button onClick={() => setPath("choose")} className="mt-8 text-sm font-semibold text-[#287047]">← Back</button>
          <p className="mt-5 text-xs font-bold tracking-[0.2em] text-[#5b8265]">JOIN A TEAM</p>
          <h1 className="mt-3 text-3xl font-semibold tracking-tight">Accept your invitation.</h1>
          <p className="mt-3 leading-7 text-[#68776d]">Your coordinator decides whether you are a partner manager or volunteer. Accept their invitation or select a team you already belong to.</p>
          <div className="mt-7 space-y-3">
            {!organizationsLoaded ? <p className="text-sm text-[#68776d]">Loading your teams…</p> : null}
            {userInvitations.data?.map((invitation) => <button key={invitation.id} disabled={isSaving} onClick={() => acceptInvitation(invitation)} className="w-full rounded-2xl border border-[#d8ded8] p-5 text-left transition hover:border-[#4d8b61] hover:bg-[#f3f8f0]"><p className="font-semibold">Accept invitation to {invitation.publicOrganizationData.name}</p><p className="mt-1 text-sm text-[#68776d]">Your coordinator assigned your operating role.</p></button>)}
            {userMemberships.data?.map((membership) => <button key={membership.id} disabled={isSaving} onClick={() => selectTeam(membership.organization.id)} className="w-full rounded-2xl border border-[#d8ded8] p-5 text-left transition hover:border-[#4d8b61] hover:bg-[#f3f8f0]"><p className="font-semibold">Open {membership.organization.name}</p><p className="mt-1 text-sm text-[#68776d]">Continue as a team member.</p></button>)}
            {organizationsLoaded && !userInvitations.data?.length && !userMemberships.data?.length ? <div className="rounded-2xl border border-dashed border-[#cfd8d0] p-5 text-sm leading-6 text-[#68776d]">No team invitations yet. Ask your coordinator to invite the email address you used to sign up.</div> : null}
          </div>
          {error ? <p className="mt-5 rounded-xl bg-[#fff0ed] px-4 py-3 text-sm text-[#a33b27]">{error}</p> : null}
        </> : null}
        {path === "create" ? <>
        <button onClick={() => setPath("choose")} className="mt-8 text-sm font-semibold text-[#287047]">← Back</button>
        <p className="mt-5 text-xs font-bold tracking-[0.2em] text-[#5b8265]">SET UP YOUR WORKSPACE</p>
        <h1 className="mt-3 text-3xl font-semibold tracking-tight">Let&apos;s make food rescue feel possible.</h1>
        <p className="mt-3 leading-7 text-[#68776d]">Create the shared space where your team will coordinate donations, partner needs, and handoffs.</p>
        <form className="mt-8 space-y-5" onSubmit={handleSubmit}>
          <label className="block text-sm font-semibold">Organization or team name<input required minLength={2} maxLength={80} value={workspaceName} onChange={(event) => setWorkspaceName(event.target.value)} placeholder="e.g. Eastside Food Rescue" className="mt-2 w-full rounded-xl border border-[#d8ded8] px-4 py-3 outline-none transition placeholder:text-[#a2aca4] focus:border-[#4d8b61] focus:ring-4 focus:ring-[#e6f1e6]" /></label>
          <label className="block text-sm font-semibold">Team timezone<select value={timezone} onChange={(event) => setTimezone(event.target.value)} className="mt-2 w-full rounded-xl border border-[#d8ded8] bg-white px-4 py-3 outline-none focus:border-[#4d8b61] focus:ring-4 focus:ring-[#e6f1e6]"><option value="UTC">UTC</option><option value="Asia/Karachi">Pakistan Standard Time</option><option value="America/New_York">Eastern Time</option><option value="America/Chicago">Central Time</option><option value="America/Los_Angeles">Pacific Time</option></select></label>
          {error ? <p className="rounded-xl bg-[#fff0ed] px-4 py-3 text-sm text-[#a33b27]">{error}</p> : null}
          <button disabled={isSaving} className="w-full rounded-xl bg-[#183d2a] px-5 py-3.5 text-sm font-bold text-white hover:bg-[#275d42] disabled:opacity-60">{isSaving ? "Creating your workspace…" : "Create workspace"}</button>
        </form>
        </> : null}
      </section>
    </main>
  );
}

export default function OnboardingPage() {
  return <Suspense fallback={null}><OnboardingContent /></Suspense>;
}
