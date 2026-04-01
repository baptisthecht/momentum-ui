"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

export function StopSessionBtn({ sessionId }: { sessionId: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [confirm, setConfirm] = useState(false);

  async function handleStop() {
    setLoading(true);
    try {
      await fetch(`/api/proxy/sessions/${sessionId}/stop`, { method: "POST" });
      router.refresh();
    } finally { setLoading(false); setConfirm(false); }
  }

  if (confirm) {
    return (
      <div className="flex items-center gap-2">
        <span className="text-xs text-zinc-400">Confirm stop?</span>
        <button onClick={handleStop} disabled={loading}
          className="rounded-md bg-red-600 px-3 py-1.5 text-xs font-medium text-white transition hover:bg-red-500 disabled:opacity-50">
          {loading ? "Stopping…" : "Yes, stop"}
        </button>
        <button onClick={() => setConfirm(false)}
          className="rounded-md border border-border px-3 py-1.5 text-xs text-zinc-400 transition hover:text-zinc-200">
          Cancel
        </button>
      </div>
    );
  }

  return (
    <button onClick={() => setConfirm(true)}
      className="rounded-md border border-red-500/30 px-3 py-1.5 text-xs font-medium text-red-400 transition hover:border-red-500/60 hover:bg-red-500/10">
      Stop session
    </button>
  );
}
