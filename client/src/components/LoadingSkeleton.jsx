export function CardSkeleton({ count = 6 }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
      {[...Array(count)].map((_, i) => (
        <div key={i} className="bg-bg-card border border-border rounded-xl p-4 animate-pulse">
          <div className="flex justify-between mb-3">
            <div>
              <div className="h-5 w-16 bg-bg-hover rounded mb-1" />
              <div className="h-3 w-24 bg-bg-hover rounded" />
            </div>
            <div className="h-6 w-16 bg-bg-hover rounded" />
          </div>
          <div className="h-7 w-24 bg-bg-hover rounded mb-2" />
          <div className="h-3 w-32 bg-bg-hover rounded" />
        </div>
      ))}
    </div>
  );
}

export function ChartSkeleton() {
  return <div className="h-[400px] bg-bg-card border border-border rounded-xl animate-pulse" />;
}

export function PanelSkeleton({ rows = 5 }) {
  return (
    <div className="bg-bg-card border border-border rounded-xl p-4 animate-pulse">
      {[...Array(rows)].map((_, i) => (
        <div key={i} className="flex justify-between py-2">
          <div className="h-4 w-24 bg-bg-hover rounded" />
          <div className="h-4 w-16 bg-bg-hover rounded" />
        </div>
      ))}
    </div>
  );
}
