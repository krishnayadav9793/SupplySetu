export function DashboardSkeleton() {
  return (
    <div
      role="status"
      aria-label="Loading workspace"
      className="w-full h-full p-4 sm:p-6 space-y-6 animate-pulse"
    >
      {/* Top Banner Skeleton */}
      <div className="h-20 bg-slate-200 dark:bg-slate-800/60 rounded-2xl w-full" />

      {/* Metric Cards Skeleton */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="h-24 bg-slate-200 dark:bg-slate-800/50 rounded-xl" />
        ))}
      </div>

      {/* Main Content Area Skeleton */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 h-72 bg-slate-200 dark:bg-slate-800/40 rounded-2xl" />
        <div className="h-72 bg-slate-200 dark:bg-slate-800/40 rounded-2xl" />
      </div>
    </div>
  );
}
