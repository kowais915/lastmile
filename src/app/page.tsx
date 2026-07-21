export default function Home() {
  return (
    <main className="grid min-h-screen place-items-center px-6 py-16">
      <section className="max-w-2xl rounded-3xl border border-black/10 bg-white p-10 shadow-sm">
        <p className="font-mono text-xs font-semibold tracking-[0.18em] text-emerald-700">
          LAST MILE / FOUNDATION
        </p>
        <h1 className="mt-4 text-4xl font-semibold tracking-tight text-balance">
          Food rescue, coordinated.
        </h1>
        <p className="mt-5 max-w-xl text-lg leading-8 text-black/65">
          Last Mile gives food-rescue coordinators an explainable, fair plan for
          getting time-sensitive donations to the right community partners before
          they expire.
        </p>
        <div className="mt-8 grid gap-3 text-sm text-black/70 sm:grid-cols-3">
          <div className="rounded-2xl bg-[#edf5eb] p-4">
            <p className="font-mono text-xs text-emerald-800">01</p>
            <p className="mt-2 font-medium">Record donations</p>
          </div>
          <div className="rounded-2xl bg-[#f8f1e7] p-4">
            <p className="font-mono text-xs text-amber-800">02</p>
            <p className="mt-2 font-medium">Plan fairly</p>
          </div>
          <div className="rounded-2xl bg-[#edf2f8] p-4">
            <p className="font-mono text-xs text-blue-800">03</p>
            <p className="mt-2 font-medium">Confirm handoffs</p>
          </div>
        </div>
      </section>
    </main>
  );
}
