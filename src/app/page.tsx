"use client";

import { useState } from "react";

type Partner = {
  id: string;
  name: string;
  neighborhood: string;
  urgency: "Critical" | "Urgent" | "Elevated";
  need: number;
  capacity: number;
  recentlyReceived: number;
  travel: string;
  travelMinutes: number;
  dietaryFit: string;
  accent: string;
};

const partners: Partner[] = [
  {
    id: "harbor",
    name: "Harbor House",
    neighborhood: "Downtown",
    urgency: "Critical",
    need: 80,
    capacity: 100,
    recentlyReceived: 0,
    travel: "8 min away",
    travelMinutes: 8,
    dietaryFit: "Vegan-ready",
    accent: "bg-rose-500",
  },
  {
    id: "northstar",
    name: "North Star Shelter",
    neighborhood: "Riverside",
    urgency: "Urgent",
    need: 65,
    capacity: 70,
    recentlyReceived: 20,
    travel: "14 min away",
    travelMinutes: 14,
    dietaryFit: "Vegan-ready",
    accent: "bg-amber-500",
  },
  {
    id: "cedar",
    name: "Cedar Community Fridge",
    neighborhood: "East Market",
    urgency: "Elevated",
    need: 45,
    capacity: 60,
    recentlyReceived: 90,
    travel: "11 min away",
    travelMinutes: 11,
    dietaryFit: "Vegan-ready",
    accent: "bg-sky-500",
  },
];

const urgencyScore = { Critical: 65, Urgent: 45, Elevated: 25 };

function score(partner: Partner) {
  return urgencyScore[partner.urgency] + 60 + 20 + Math.max(0, 30 - partner.recentlyReceived / 10) - partner.travelMinutes / 2;
}

export default function Home() {
  const [confirmed, setConfirmed] = useState(false);
  const [delivered, setDelivered] = useState<string[]>([]);
  const [showReason, setShowReason] = useState("harbor");
  const allocation = [...partners]
    .sort((a, b) => score(b) - score(a))
    .reduce<{ items: Array<Partner & { portions: number; score: number }>; remaining: number }>(
      (result, partner) => {
        const portions = Math.min(
          result.remaining,
          partner.need,
          partner.capacity,
        );

        return {
          items: [...result.items, { ...partner, portions, score: Math.round(score(partner)) }],
          remaining: result.remaining - portions,
        };
      },
      { items: [], remaining: 180 },
    ).items;
  const allocated = allocation.reduce((total, item) => total + item.portions, 0);

  function completePickup(id: string) {
    setDelivered((items) => (items.includes(id) ? items : [...items, id]));
  }

  return (
    <main className="min-h-screen bg-[#f7f6f2] text-[#18231e]">
      <header className="mx-auto flex max-w-7xl items-center justify-between px-6 py-6 lg:px-10">
        <div className="flex items-center gap-3">
          <div className="grid size-10 place-items-center rounded-xl bg-[#183d2a] text-lg font-black text-[#e9f3d5]">L</div>
          <div>
            <p className="text-lg font-bold tracking-tight">Last Mile</p>
            <p className="text-xs text-[#64736a]">Food rescue, coordinated</p>
          </div>
        </div>
        <div className="hidden items-center gap-3 sm:flex">
          <span className="rounded-full bg-[#e5efe1] px-3 py-1.5 text-xs font-semibold text-[#2e6b45]">Demo workspace</span>
          <div className="grid size-9 place-items-center rounded-full bg-[#e7c3a6] text-xs font-bold text-[#633a24]">OM</div>
        </div>
      </header>

      <div className="mx-auto max-w-7xl px-6 pb-14 lg:px-10">
        <section className="overflow-hidden rounded-[2rem] bg-[#183d2a] px-7 py-8 text-[#f9f9f4] shadow-[0_24px_60px_rgba(24,61,42,0.18)] lg:px-10">
          <div className="flex flex-col justify-between gap-8 md:flex-row md:items-end">
            <div>
              <p className="text-xs font-bold tracking-[0.2em] text-[#b6d59a]">LIVE ALLOCATION BOARD</p>
              <h1 className="mt-3 max-w-2xl text-3xl font-semibold tracking-tight sm:text-4xl">180 meals have a home before the clock runs out.</h1>
              <p className="mt-3 max-w-xl text-sm leading-6 text-[#c9d8cd]">A transparent plan for today&apos;s donation from Green Fork Kitchen, expiring at 5:30 PM.</p>
            </div>
            <div className="flex gap-6 text-sm">
              <div><p className="text-2xl font-semibold">1h 42m</p><p className="text-[#b9cbbd]">until expiry</p></div>
              <div><p className="text-2xl font-semibold">{confirmed ? "3" : "0"}/3</p><p className="text-[#b9cbbd]">pickups dispatched</p></div>
            </div>
          </div>
        </section>

        <section className="mt-7 grid gap-5 lg:grid-cols-[1.45fr_0.85fr]">
          <div className="rounded-[1.75rem] border border-[#e5e2d9] bg-white p-6 shadow-sm sm:p-7">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <p className="text-xs font-bold tracking-[0.16em] text-[#65806b]">RECOMMENDED PLAN</p>
                <h2 className="mt-2 text-2xl font-semibold tracking-tight">Move every meal, fairly.</h2>
              </div>
              <div className="rounded-xl bg-[#f2f6ed] px-3 py-2 text-right"><p className="text-lg font-bold text-[#21633e]">{allocated} / 180</p><p className="text-xs text-[#718072]">meals allocated</p></div>
            </div>

            <div className="mt-6 space-y-3">
              {allocation.map((item, index) => (
                <button key={item.id} onClick={() => setShowReason(item.id)} className={`w-full rounded-2xl border p-4 text-left transition ${showReason === item.id ? "border-[#4d8b61] bg-[#f3f8f0] shadow-sm" : "border-[#eceae4] hover:border-[#a2bca8]"}`}>
                  <div className="flex items-center gap-3">
                    <div className={`grid size-9 place-items-center rounded-xl ${item.accent} text-sm font-bold text-white`}>{index + 1}</div>
                    <div className="min-w-0 flex-1"><div className="flex items-center justify-between gap-3"><p className="font-semibold">{item.name}</p><p className="font-bold tabular-nums">{item.portions} meals</p></div><p className="mt-1 text-sm text-[#6b786f]">{item.neighborhood} · {item.travel} · {item.dietaryFit}</p></div>
                  </div>
                </button>
              ))}
            </div>
            <button onClick={() => setConfirmed(true)} disabled={confirmed} className="mt-6 w-full rounded-xl bg-[#183d2a] px-5 py-3.5 text-sm font-bold text-white transition hover:bg-[#275d42] disabled:cursor-default disabled:bg-[#609071]">{confirmed ? "Plan dispatched — pickup tasks are live" : "Confirm plan & dispatch 3 pickups"}</button>
          </div>

          <aside className="rounded-[1.75rem] border border-[#e5e2d9] bg-[#fcfbf7] p-6 shadow-sm sm:p-7">
            {allocation.filter((item) => item.id === showReason).map((item) => <div key={item.id}>
              <p className="text-xs font-bold tracking-[0.16em] text-[#65806b]">WHY THIS ALLOCATION</p>
              <h2 className="mt-2 text-2xl font-semibold tracking-tight">{item.name}</h2>
              <p className="mt-2 text-sm leading-6 text-[#68776d]">Every recommendation is explainable, editable, and saved to the allocation record.</p>
              <div className="mt-6 rounded-2xl bg-[#edf4e9] p-4"><p className="text-xs font-bold tracking-wide text-[#407353]">MATCH CONFIDENCE</p><p className="mt-1 text-3xl font-bold text-[#1d5937]">{item.score}<span className="text-base text-[#5f8469]"> / 175</span></p></div>
              <ul className="mt-5 space-y-4 text-sm"><li className="flex gap-3"><span className="mt-0.5 text-[#397e50]">●</span><span><b>{item.urgency} need</b><br/><span className="text-[#6b786f]">This partner needs {item.need} meals today.</span></span></li><li className="flex gap-3"><span className="mt-0.5 text-[#397e50]">●</span><span><b>Time and dietary fit</b><br/><span className="text-[#6b786f]">They can receive before 5:30 PM and safely serve these vegan meals.</span></span></li><li className="flex gap-3"><span className="mt-0.5 text-[#397e50]">●</span><span><b>Fair access protected</b><br/><span className="text-[#6b786f]">Recent meals received: {item.recentlyReceived}. The plan avoids concentrating supply.</span></span></li><li className="flex gap-3"><span className="mt-0.5 text-[#397e50]">●</span><span><b>Low travel cost</b><br/><span className="text-[#6b786f]">A {item.travelMinutes}-minute route keeps this food moving.</span></span></li></ul>
            </div>)}
          </aside>
        </section>

        <section className="mt-7 rounded-[1.75rem] border border-[#e5e2d9] bg-white p-6 shadow-sm sm:p-7">
          <div className="flex flex-wrap items-end justify-between gap-3"><div><p className="text-xs font-bold tracking-[0.16em] text-[#65806b]">VOLUNTEER HANDOFFS</p><h2 className="mt-2 text-2xl font-semibold tracking-tight">Close the loop, not just the match.</h2></div><p className="text-sm text-[#6b786f]">{delivered.length} of 3 deliveries confirmed</p></div>
          <div className="mt-5 grid gap-3 md:grid-cols-3">{allocation.map((item) => { const isDelivered = delivered.includes(item.id); return <div key={item.id} className="rounded-2xl border border-[#eceae4] p-4"><div className="flex items-center justify-between"><p className="font-semibold">{item.name}</p><span className={`rounded-full px-2.5 py-1 text-xs font-bold ${isDelivered ? "bg-[#e4f2e3] text-[#287047]" : confirmed ? "bg-[#fff1d7] text-[#976412]" : "bg-[#f1f0ec] text-[#74746e]"}`}>{isDelivered ? "Delivered" : confirmed ? "Ready to claim" : "Awaiting dispatch"}</span></div><p className="mt-2 text-sm text-[#6b786f]">{item.portions} meals · {item.travel}</p><button disabled={!confirmed || isDelivered} onClick={() => completePickup(item.id)} className="mt-4 w-full rounded-lg border border-[#cedbd0] px-3 py-2 text-sm font-semibold text-[#285d3c] disabled:cursor-not-allowed disabled:opacity-45">{isDelivered ? "Handoff recorded" : "Confirm delivery"}</button></div>})}</div>
        </section>
      </div>
    </main>
  );
}
