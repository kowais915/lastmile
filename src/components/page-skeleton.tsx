type SkeletonProps = { className: string };

function Skeleton({ className }: SkeletonProps) {
  return <div aria-hidden className={`animate-pulse rounded-2xl bg-[#e6ebe4] ${className}`} />;
}

export function DashboardSkeleton({ title }: { title: string }) {
  return <main className="min-h-screen bg-[#f7f6f2] px-6 py-7 text-[#18231e]"><div className="mx-auto max-w-6xl"><div className="flex items-start justify-between gap-4"><div><Skeleton className="h-3 w-32" /><h1 className="mt-3 text-3xl font-semibold tracking-tight">{title}</h1></div><Skeleton className="h-11 w-24" /></div><Skeleton className="mt-8 h-56 w-full rounded-[2rem] bg-[#d8e3d7]" /><div className="mt-7 grid gap-6 lg:grid-cols-[1.35fr_.65fr]"><section className="rounded-[1.75rem] border border-[#e5e2d9] bg-white p-6 shadow-sm"><Skeleton className="h-4 w-28" /><Skeleton className="mt-4 h-8 w-60" /><div className="mt-6 space-y-4">{[1, 2, 3].map((item) => <Skeleton key={item} className="h-32 w-full" />)}</div></section><aside className="rounded-[1.75rem] border border-[#e5e2d9] bg-white p-6 shadow-sm"><Skeleton className="h-4 w-24" /><Skeleton className="mt-5 h-8 w-44" /><div className="mt-6 space-y-3">{[1, 2, 3, 4].map((item) => <Skeleton key={item} className="h-14 w-full" />)}</div></aside></div></div></main>;
}

export function FormSkeleton({ title }: { title: string }) {
  return <main className="min-h-screen bg-[#f7f6f2] px-6 py-12 text-[#18231e]"><div className="mx-auto max-w-4xl"><Skeleton className="ml-auto h-11 w-24" /><section className="mt-6 grid gap-6 lg:grid-cols-[.8fr_1.2fr]"><div className="rounded-[2rem] bg-[#d8e3d7] p-7"><Skeleton className="h-4 w-32 bg-white/50" /><h1 className="mt-4 text-3xl font-semibold">{title}</h1><Skeleton className="mt-5 h-16 w-full bg-white/40" /></div><div className="rounded-[2rem] border border-[#e2e2d9] bg-white p-7 shadow-sm"><Skeleton className="h-7 w-48" /><div className="mt-6 grid gap-4 sm:grid-cols-2">{[1, 2, 3, 4].map((item) => <Skeleton key={item} className="h-20 w-full" />)}</div><Skeleton className="mt-6 h-12 w-full" /></div></section></div></main>;
}
