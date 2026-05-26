export default function Loading() {
  return (
    <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6">
      <div className="mb-6 h-9 w-40 animate-pulse rounded-lg bg-black/5" />
      <div className="mb-3 flex gap-2">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="h-7 w-20 animate-pulse rounded-full bg-black/5" />
        ))}
      </div>
      <div className="mb-4 flex gap-3">
        <div className="h-7 w-32 animate-pulse rounded bg-black/5" />
        <div className="ml-auto h-7 w-48 animate-pulse rounded bg-black/5" />
      </div>
      <div className="mb-6 flex gap-2">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="h-7 w-24 animate-pulse rounded-full bg-black/5" />
        ))}
      </div>
      <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="h-32 animate-pulse rounded-2xl border border-black/5 bg-white" />
        ))}
      </div>
    </main>
  );
}
