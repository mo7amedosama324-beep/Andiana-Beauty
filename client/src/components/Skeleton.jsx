export function SkeletonCard() {
  return (
    <div className="animate-pulse rounded-card border border-brand-100 bg-white/80 p-4 shadow-soft">
      <div className="h-36 rounded-2xl bg-stone-200/80" />
      <div className="mt-4 h-4 w-3/4 rounded-full bg-stone-200/80" />
      <div className="mt-2 h-3 w-1/2 rounded-full bg-stone-200/80" />
      <div className="mt-4 h-10 rounded-button bg-stone-200/80" />
    </div>
  )
}

export function SkeletonPage() {
  return (
    <div className="page-shell space-y-6">
      <div className="animate-pulse rounded-page border border-brand-100 bg-white/80 p-6 shadow-soft">
        <div className="h-8 w-56 rounded-full bg-stone-200/80" />
        <div className="mt-4 h-4 w-2/3 rounded-full bg-stone-200/80" />
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        <SkeletonCard />
        <SkeletonCard />
      </div>
    </div>
  )
}
