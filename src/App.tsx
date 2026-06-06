import { useQuery } from "@tanstack/react-query";

interface Health {
  status: string;
  time: string;
}

export default function App() {
  const { data, isLoading, isError } = useQuery<Health>({
    queryKey: ["health"],
    queryFn: async () => {
      const res = await fetch("/api/health");
      if (!res.ok) throw new Error("health check failed");
      return res.json();
    },
  });

  return (
    <main className="min-h-screen bg-neutral-950 text-neutral-100 flex flex-col items-center justify-center gap-6 p-8">
      <div className="text-center">
        <h1 className="text-4xl font-bold tracking-tight">Design Resources</h1>
        <p className="mt-2 text-neutral-400">
          A living library of design resources — curated and shared.
        </p>
      </div>

      <div className="rounded-xl border border-neutral-800 bg-neutral-900 px-5 py-3 text-sm">
        <span className="text-neutral-400">API status: </span>
        {isLoading && <span className="text-amber-400">checking…</span>}
        {isError && <span className="text-red-400">unreachable</span>}
        {data && (
          <span className="text-emerald-400">
            {data.status} · {new Date(data.time).toLocaleTimeString()}
          </span>
        )}
      </div>

      <p className="text-xs text-neutral-600">Phase 0 — scaffold</p>
    </main>
  );
}
