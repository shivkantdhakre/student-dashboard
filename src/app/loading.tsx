export default function Loading() {
  return (
    <div className="space-y-8 max-w-6xl mx-auto animate-pulse">
      {/* Header Skeleton */}
      <div className="space-y-3">
        <div className="h-9 bg-white/5 rounded-2xl w-2/5" />
        <div className="h-4 bg-white/5 rounded-xl w-1/3" />
      </div>

      {/* Grid Skeleton (replicates Bento layout dimensions to avoid layout shifts) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 auto-rows-[220px]">
        {/* Featured Skeleton (2 cols, 2 rows) */}
        <div className="md:col-span-2 md:row-span-2 rounded-3xl border border-white/5 bg-[#09090b]/20 p-6 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <div className="w-12 h-12 rounded-2xl bg-white/5" />
            <div className="w-24 h-4 bg-white/5 rounded-lg" />
          </div>
          <div className="space-y-4">
            <div className="space-y-2">
              <div className="h-8 bg-white/5 rounded-xl w-1/2" />
              <div className="h-4 bg-white/5 rounded-lg w-1/4" />
            </div>
            <div className="w-full bg-white/5 h-2 rounded-full" />
          </div>
        </div>

        {/* Regular Skeletons */}
        {[...Array(4)].map((_, i) => (
          <div
            key={i}
            className="rounded-3xl border border-white/5 bg-[#09090b]/20 p-6 flex flex-col justify-between"
          >
            <div className="flex items-center justify-between">
              <div className="w-10 h-10 rounded-2xl bg-white/5" />
              <div className="w-20 h-4 bg-white/5 rounded-lg" />
            </div>
            <div className="space-y-3">
              <div className="h-6 bg-white/5 rounded-lg w-3/4" />
              <div className="h-2 bg-white/5 rounded-full w-full" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
