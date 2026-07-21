import { OrganizationSwitcher } from "@clerk/nextjs";
import { auth, currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";

import { SignOutControl } from "@/components/sign-out-control";
import { OperationsMap } from "@/components/operations-map";
import { SubmitButton } from "@/components/submit-button";
import { ensureWorkspaceMember, getVolunteerTasks, getWorkspace } from "@/lib/db";

import { updatePickupTask } from "./actions";

type VolunteerTask = Awaited<ReturnType<typeof getVolunteerTasks>>[number];

const statusMeta = {
  unclaimed: { label: "Ready to claim", className: "bg-[#f2ecdc] text-[#8a631a]" },
  claimed: { label: "Pickup next", className: "bg-[#e7effb] text-[#295ea8]" },
  collected: { label: "En route", className: "bg-[#e8f4ec] text-[#287047]" },
  delivered: { label: "Delivered", className: "bg-[#edf1ed] text-[#52675a]" },
} as const;

function localDate(value: string, options: Intl.DateTimeFormatOptions = { dateStyle: "medium", timeStyle: "short" }) {
  return new Intl.DateTimeFormat("en", options).format(new Date(value));
}

function taskAction(task: VolunteerTask) {
  if (task.status === "unclaimed") return { action: "claim", label: "Claim this pickup" };
  if (task.status === "claimed") return { action: "collected", label: "Mark food collected" };
  if (task.status === "collected") return { action: "delivered", label: "Confirm delivery" };
  return null;
}

function StatusPill({ status }: { status: keyof typeof statusMeta }) {
  const meta = statusMeta[status];
  return <span className={`rounded-full px-3 py-1 text-xs font-bold ${meta.className}`}>{meta.label}</span>;
}

function TaskDetails({ task, compact = false }: { task: VolunteerTask; compact?: boolean }) {
  return <>
    <div className={compact ? "mt-4 grid gap-3 text-sm" : "mt-6 grid gap-3 text-sm sm:grid-cols-2"}>
      <div className="rounded-xl bg-[#f5f7f2] px-4 py-3">
        <p className="text-xs font-bold tracking-[0.13em] text-[#65806b]">PICK UP FROM</p>
        <p className="mt-1 font-semibold text-[#18231e]">{task.donorName}</p>
        <p className="mt-1 text-[#68776d]">{localDate(task.collectionWindowStart)}–{localDate(task.collectionWindowEnd, { timeStyle: "short" })}</p>
      </div>
      <div className="rounded-xl bg-[#f5f7f2] px-4 py-3">
        <p className="text-xs font-bold tracking-[0.13em] text-[#65806b]">DELIVER TO</p>
        <p className="mt-1 font-semibold text-[#18231e]">{task.partnerName}</p>
        <p className="mt-1 text-[#68776d]">{task.partnerServiceArea || "Destination details shared by your coordinator"}</p>
      </div>
    </div>
    <div className="mt-4 flex flex-wrap gap-2 text-xs font-semibold text-[#506157]">
      <span className="rounded-full border border-[#dbe3da] bg-white px-3 py-1.5">{task.portions} meals</span>
      <span className="rounded-full border border-[#dbe3da] bg-white px-3 py-1.5">Expires {localDate(task.expiresAt)}</span>
      {task.dietaryTags.map((tag) => <span key={tag} className="rounded-full border border-[#dbe3da] bg-white px-3 py-1.5">{tag}</span>)}
    </div>
  </>;
}

function TaskAction({ task, emphasize = false }: { task: VolunteerTask; emphasize?: boolean }) {
  const next = taskAction(task);
  if (!next) return null;
  const buttonClass = emphasize
    ? "w-full rounded-xl bg-[#d7ef8a] px-4 py-3 text-sm font-bold text-[#163d2a] hover:bg-[#c8e77a]"
    : "w-full rounded-xl bg-[#183d2a] px-4 py-3 text-sm font-bold text-white hover:bg-[#285d3c]";

  return <form action={updatePickupTask} className="mt-5">
    <input type="hidden" name="taskId" value={task.id} />
    <input type="hidden" name="action" value={next.action} />
    {next.action === "delivered" ? <label className={`mb-3 block text-sm font-semibold ${emphasize ? "text-white" : "text-[#18231e]"}`}>Delivery note <span className={`font-normal ${emphasize ? "text-[#c9d8cd]" : "text-[#68776d]"}`}>(optional)</span><textarea name="deliveryNote" maxLength={500} rows={2} placeholder="e.g. Handed to the front-desk team at 2:15 PM" className="mt-2 w-full resize-none rounded-xl border border-[#d8ded8] bg-white px-3 py-2.5 font-normal text-[#18231e] outline-none placeholder:text-[#68776d] focus:border-[#5b8265]" /></label> : null}
    <SubmitButton pendingChildren={next.action === "claim" ? "Claiming pickup…" : next.action === "collected" ? "Saving collection…" : "Saving delivery…"} className={buttonClass}>{next.label}</SubmitButton>
  </form>;
}

export default async function VolunteerPage() {
  const { orgId, userId } = await auth();
  if (!orgId || !userId) redirect("/sign-in");
  const workspace = await getWorkspace(orgId);
  if (!workspace) redirect("/onboarding");
  const user = await currentUser();
  const role = await ensureWorkspaceMember(workspace.id, userId, user?.primaryEmailAddress?.emailAddress);
  if (role !== "volunteer") redirect("/portal");

  const tasks = await getVolunteerTasks(workspace.id, userId);
  const myTasks = tasks.filter((task) => task.volunteerUserId === userId);
  const availableTasks = tasks.filter((task) => task.status === "unclaimed");
  const activeTasks = myTasks.filter((task) => task.status === "claimed" || task.status === "collected");
  const completedTasks = myTasks.filter((task) => task.status === "delivered");
  const focusTask = activeTasks[0] ?? null;
  const mapRoutes = tasks.map((task) => ({
    id: task.id,
    itemName: task.itemName,
    portions: task.portions,
    status: task.status,
    pickup: { name: task.donorName, latitude: task.pickupLatitude, longitude: task.pickupLongitude },
    destination: { name: task.partnerName, detail: task.partnerServiceArea, latitude: task.partnerLatitude, longitude: task.partnerLongitude },
  }));

  return <main className="min-h-screen bg-[#f7f6f2] text-[#18231e]">
    <header className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 px-6 py-7">
      <div>
        <p className="text-xs font-bold tracking-[0.2em] text-[#5b8265]">{workspace.name.toUpperCase()}</p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight">Volunteer fieldboard</h1>
      </div>
      <div className="flex items-center gap-3">
        <OrganizationSwitcher
          hidePersonal
          afterSelectOrganizationUrl="/portal"
          afterCreateOrganizationUrl="/onboarding"
          appearance={{
            elements: {
              rootBox: "max-w-[220px]",
              organizationSwitcherTrigger: "rounded-xl border border-[#cfd8d0] bg-white px-3 py-2.5 text-sm font-bold text-[#285d3c] hover:bg-[#f2f6ed]",
            },
          }}
        />
        <SignOutControl />
      </div>
    </header>

    <div className="mx-auto max-w-6xl px-6 pb-14">
      <section className="rounded-[2rem] bg-[#183d2a] p-7 text-white sm:p-9">
        <div className="flex flex-wrap items-end justify-between gap-6">
          <div>
            <p className="text-xs font-bold tracking-[0.2em] text-[#b6d59a]">FIELD OPERATIONS</p>
            <h2 className="mt-3 max-w-2xl text-3xl font-semibold">Pick up with confidence. Close every handoff.</h2>
            <p className="mt-3 max-w-xl text-sm leading-6 text-[#c9d8cd]">Your board only shows tasks you can claim or already own. Each update gives the coordinator a live picture of the rescue.</p>
          </div>
          <div className="flex gap-7 text-right">
            <div><p className="text-3xl font-bold">{activeTasks.length}</p><p className="text-sm text-[#b9cbbd]">in progress</p></div>
            <div><p className="text-3xl font-bold">{availableTasks.length}</p><p className="text-sm text-[#b9cbbd]">ready to claim</p></div>
            <div><p className="text-3xl font-bold">{completedTasks.length}</p><p className="text-sm text-[#b9cbbd]">delivered</p></div>
          </div>
        </div>
      </section>

      <section className="mt-7 grid gap-6 lg:grid-cols-[1.35fr_.65fr]">
        <div className="space-y-6">
          <section className="rounded-[1.75rem] border border-[#e5e2d9] bg-white p-6 shadow-sm">
            <p className="text-xs font-bold tracking-[0.16em] text-[#65806b]">YOUR NEXT HANDOFF</p>
            {focusTask ? <article className="mt-4 rounded-2xl bg-[#183d2a] p-5 text-white sm:p-6">
              <div className="flex flex-wrap items-start justify-between gap-3"><div><p className="text-xl font-semibold">{focusTask.itemName}</p><p className="mt-1 text-sm text-[#c9d8cd]">{focusTask.portions} meals · from {focusTask.donorName}</p></div><StatusPill status={focusTask.status as keyof typeof statusMeta} /></div>
              <div className="mt-6 grid gap-3 text-sm sm:grid-cols-2"><div className="rounded-xl bg-white/10 px-4 py-3"><p className="text-xs font-bold tracking-[0.13em] text-[#b6d59a]">PICKUP WINDOW</p><p className="mt-1 font-semibold">{localDate(focusTask.collectionWindowStart)}–{localDate(focusTask.collectionWindowEnd, { timeStyle: "short" })}</p></div><div className="rounded-xl bg-white/10 px-4 py-3"><p className="text-xs font-bold tracking-[0.13em] text-[#b6d59a]">DESTINATION</p><p className="mt-1 font-semibold">{focusTask.partnerName}</p><p className="mt-1 text-[#c9d8cd]">{focusTask.partnerServiceArea || "Confirm destination with your coordinator"}</p></div></div>
              <div className="mt-4 flex flex-wrap gap-2 text-xs font-semibold text-[#e9f3d5]"><span className="rounded-full border border-white/20 px-3 py-1.5">Expires {localDate(focusTask.expiresAt)}</span>{focusTask.dietaryTags.map((tag) => <span key={tag} className="rounded-full border border-white/20 px-3 py-1.5">{tag}</span>)}</div>
              <TaskAction task={focusTask} emphasize />
            </article> : <div className="mt-4 rounded-2xl border border-dashed border-[#cfd8d0] bg-[#f8faf6] px-6 py-8 text-center"><p className="font-semibold">Nothing is in motion for you yet.</p><p className="mt-2 text-sm leading-6 text-[#68776d]">Claim a pickup below when you are ready. Once you do, it stays visible only to you.</p></div>}
            {activeTasks.length > 1 ? <div className="mt-5"><p className="text-xs font-bold tracking-[0.14em] text-[#65806b]">ADDITIONAL HANDOFFS</p><div className="mt-3 max-h-[34rem] space-y-3 overflow-y-auto pr-2">{activeTasks.slice(1).map((task) => <article key={task.id} className="rounded-2xl border border-[#e5e2d9] p-5"><div className="flex flex-wrap items-start justify-between gap-3"><div><p className="font-semibold">{task.itemName} · {task.portions} meals</p><p className="mt-1 text-sm text-[#68776d]">{task.donorName} → {task.partnerName}</p></div><StatusPill status={task.status as keyof typeof statusMeta} /></div><TaskDetails task={task} compact /><TaskAction task={task} /></article>)}</div></div> : null}
          </section>

          <section className="rounded-[1.75rem] border border-[#e5e2d9] bg-white p-6 shadow-sm">
            <div className="flex flex-wrap items-end justify-between gap-3"><div><p className="text-xs font-bold tracking-[0.16em] text-[#65806b]">AVAILABLE PICKUPS</p><h2 className="mt-2 text-2xl font-semibold">Choose a handoff</h2></div><p className="text-sm text-[#68776d]">Claiming locks it to you.</p></div>
            <div className="mt-6 max-h-[44rem] space-y-4 overflow-y-auto pr-2">{availableTasks.length ? availableTasks.map((task) => <article key={task.id} className="rounded-2xl border border-[#e5e2d9] p-5"><div className="flex flex-wrap items-start justify-between gap-3"><div><p className="font-semibold text-[#18231e]">{task.itemName} · {task.portions} meals</p><p className="mt-1 text-sm text-[#68776d]">{task.donorName} → {task.partnerName}</p></div><StatusPill status="unclaimed" /></div><TaskDetails task={task} compact /><TaskAction task={task} /></article>) : <div className="rounded-2xl border border-dashed border-[#cfd8d0] px-6 py-8 text-center text-sm text-[#68776d]">No unclaimed pickups right now. New coordinator dispatches will appear here.</div>}</div>
          </section>

        </div>

        <aside className="space-y-6">
          <section className="rounded-[1.75rem] border border-[#e5e2d9] bg-white p-6 shadow-sm"><p className="text-xs font-bold tracking-[0.16em] text-[#65806b]">HANDOFF STEPS</p><ol className="mt-5 space-y-4 text-sm"><li className="flex gap-3"><span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#183d2a] text-xs font-bold text-white">1</span><span><b>Claim</b><br /><span className="text-[#68776d]">Reserve a pickup so other volunteers know it&apos;s covered.</span></span></li><li className="flex gap-3"><span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#183d2a] text-xs font-bold text-white">2</span><span><b>Collect</b><br /><span className="text-[#68776d]">Confirm food is safely in your care.</span></span></li><li className="flex gap-3"><span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#183d2a] text-xs font-bold text-white">3</span><span><b>Deliver</b><br /><span className="text-[#68776d]">Confirm the partner received it and leave an optional note.</span></span></li></ol></section>
          <section className="rounded-[1.75rem] border border-[#e5e2d9] bg-white p-6 shadow-sm"><div className="flex items-end justify-between gap-3"><div><p className="text-xs font-bold tracking-[0.16em] text-[#65806b]">YOUR COMPLETED WORK</p><h2 className="mt-2 text-2xl font-semibold">Delivery log</h2></div><p className="text-2xl font-bold text-[#285d3c]">{completedTasks.length}</p></div><div className="mt-5 max-h-[34rem] space-y-3 overflow-y-auto pr-2">{completedTasks.length ? completedTasks.map((task) => <article key={task.id} className="rounded-xl bg-[#f5f7f2] p-4"><div className="flex items-start justify-between gap-3"><div><p className="font-semibold">{task.partnerName}</p><p className="mt-1 text-sm text-[#68776d]">{task.itemName} · {task.portions} meals</p></div><StatusPill status="delivered" /></div>{task.deliveredAt ? <p className="mt-3 text-xs text-[#68776d]">Delivered {localDate(task.deliveredAt)}</p> : null}{task.deliveryNote ? <p className="mt-2 border-l-2 border-[#b8cfba] pl-3 text-sm italic text-[#52675a]">“{task.deliveryNote}”</p> : null}</article>) : <p className="rounded-xl bg-[#f5f7f2] p-4 text-sm leading-6 text-[#68776d]">Completed handoffs will appear here with their delivery time and note.</p>}</div></section>
        </aside>
      </section>

      <div className="mt-6">
        <OperationsMap routes={mapRoutes} title="Pickups and destinations in your queue" />
      </div>
    </div>
  </main>;
}
