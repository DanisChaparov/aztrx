/**
 * Instant skeleton shown during page transitions — makes navigation feel
 * immediate instead of the blank-white-flash of a full Server Component render.
 */
export default function AppLoading() {
  return (
    <div className="flex flex-col gap-6 pt-8">
      {/* Header skeleton */}
      <div className="flex items-center justify-between">
        <div className="h-8 w-40 animate-pulse rounded-lg bg-white/5" />
        <div className="h-9 w-36 animate-pulse rounded-xl bg-white/5" />
      </div>

      {/* Stats row skeleton */}
      <div className="flex flex-wrap gap-4">
        <div className="h-10 w-28 animate-pulse rounded-full bg-white/5" />
        <div className="h-10 w-24 animate-pulse rounded-full bg-white/5" />
        <div className="h-10 w-16 animate-pulse rounded-full bg-white/5" />
      </div>

      {/* Card skeletons */}
      {[1, 2, 3].map((i) => (
        <div key={i} className="animate-pulse rounded-2xl border border-white/5 bg-[#0e0f14] p-6">
          <div className="mb-3 h-4 w-48 rounded bg-white/5" />
          <div className="h-3 w-full rounded bg-white/5" />
        </div>
      ))}
    </div>
  );
}
