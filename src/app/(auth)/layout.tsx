import Link from "next/link";

export default function AuthLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <main className="min-h-screen bg-[#f7f6f2] px-6 py-8 text-[#18231e] sm:p-12">
      <div className="mx-auto grid min-h-[calc(100vh-4rem)] max-w-6xl overflow-hidden rounded-[2rem] border border-[#e2e2d9] bg-white shadow-[0_24px_70px_rgba(24,61,42,0.1)] lg:grid-cols-[1.1fr_0.9fr]">
        <section className="hidden bg-[#183d2a] p-12 text-[#f9f9f4] lg:flex lg:flex-col lg:justify-between">
          <Link href="/" className="flex items-center gap-3 font-semibold">
            <span className="grid size-10 place-items-center rounded-xl bg-[#e9f3d5] text-lg font-black text-[#183d2a]">L</span>
            Last Mile
          </Link>
          <div>
            <p className="text-xs font-bold tracking-[0.2em] text-[#b6d59a]">FOOD RESCUE OPERATIONS</p>
            <h1 className="mt-4 max-w-md text-4xl font-semibold leading-tight">Every meal deserves a clear next move.</h1>
            <p className="mt-5 max-w-sm leading-7 text-[#c9d8cd]">Coordinate donations, partner needs, and volunteer handoffs in one trusted workspace.</p>
          </div>
          <p className="text-sm text-[#b9cbbd]">Explainable decisions. Stronger community response.</p>
        </section>
        <section className="flex items-center justify-center p-6 sm:p-12">{children}</section>
      </div>
    </main>
  );
}
