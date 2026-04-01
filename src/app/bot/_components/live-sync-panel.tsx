"use client";
import { useState, useCallback } from "react";
import { fmtUsd, fmt, sideColor } from "@/lib/utils";
import { Badge } from "@/components/ui/shared";

interface LiveBalance { available: number; equity: number; unrealizedPnl: number; }
interface LivePosition {
  symbol: string; side: string; qty: number; entryPrice: number;
  markPrice: number; unrealizedPnl: number; liqPrice: number; leverage: number; marginSize: number; roe?: number;
}
interface TpslOrder { orderId: string; planType: string; side: string; triggerPrice: number; size: number; status: string; }
interface Snapshot { isReal: boolean; balance: LiveBalance; positions: LivePosition[]; openOrders: TpslOrder[]; }

export function LiveSyncPanel({ sessionId }: { sessionId: string }) {
  const [snapshot, setSnapshot] = useState<Snapshot | null>(null);
  const [loading, setLoading] = useState(false);
  const [lastSync, setLastSync] = useState<Date | null>(null);
  const [error, setError] = useState("");

  const refresh = useCallback(async () => {
    setLoading(true); setError("");
    try {
      const res = await fetch(`/api/proxy/sessions/${sessionId}/sync/snapshot`);
      if (!res.ok) throw new Error("Sync failed");
      const data = await res.json();
      setSnapshot(data);
      setLastSync(new Date());
    } catch (e: any) {
      setError(e.message ?? "Sync failed");
    } finally { setLoading(false); }
  }, [sessionId]);

  const reconcile = useCallback(async () => {
    setLoading(true); setError("");
    try {
      await fetch(`/api/proxy/sessions/${sessionId}/sync/reconcile`, { method: "POST" });
      await refresh();
    } catch (e: any) {
      setError(e.message);
    } finally { setLoading(false); }
  }, [sessionId, refresh]);

  if (!snapshot && !loading) {
    return (
      <div className="flex items-center justify-between">
        <p className="text-xs text-zinc-500">Live Bitget data not loaded</p>
        <button onClick={refresh} className="rounded-md border border-border px-3 py-1.5 text-xs text-zinc-400 hover:text-zinc-200 transition">
          Load live data
        </button>
      </div>
    );
  }

  if (loading && !snapshot) {
    return <p className="text-xs text-zinc-500 animate-pulse">Fetching from Bitget…</p>;
  }

  return (
    <div className="space-y-4">
      {/* Controls */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-400" />
          </span>
          <span className="text-xs text-zinc-400">
            Live · {lastSync ? `Updated ${lastSync.toLocaleTimeString()}` : "—"}
          </span>
        </div>
        <div className="flex gap-2">
          <button onClick={refresh} disabled={loading}
            className="rounded-md border border-border px-2.5 py-1 text-xs text-zinc-400 hover:text-zinc-200 transition disabled:opacity-40">
            {loading ? "Syncing…" : "↻ Refresh"}
          </button>
          <button onClick={reconcile} disabled={loading}
            className="rounded-md border border-accent/30 px-2.5 py-1 text-xs text-accent hover:bg-accent/10 transition disabled:opacity-40">
            Reconcile
          </button>
        </div>
      </div>

      {error && <p className="text-xs text-red-400">{error}</p>}

      {snapshot && (
        <>
          {/* Balance */}
          <div className="grid grid-cols-3 gap-3">
            {[
              { label: "Available", value: fmtUsd(snapshot.balance.available) },
              { label: "Equity", value: fmtUsd(snapshot.balance.equity), highlight: true },
              { label: "Unrealized P&L", value: fmtUsd(snapshot.balance.unrealizedPnl),
                color: snapshot.balance.unrealizedPnl >= 0 ? "text-emerald-400" : "text-red-400" },
            ].map(s => (
              <div key={s.label} className="rounded-lg bg-surface-2 px-3 py-2.5">
                <p className="text-[10px] uppercase tracking-wide text-zinc-600">{s.label}</p>
                <p className={`mt-0.5 font-mono text-sm font-semibold ${s.color ?? "text-zinc-100"}`}>{s.value}</p>
              </div>
            ))}
          </div>

          {/* Live positions */}
          {snapshot.positions.length > 0 && (
            <div>
              <p className="mb-2 text-xs font-medium text-zinc-400">Live Positions ({snapshot.positions.length})</p>
              <div className="space-y-2">
                {snapshot.positions.map((p, i) => (
                  <div key={i} className="rounded-lg border border-border bg-surface-2 px-4 py-3">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <span className={`font-mono text-xs font-bold uppercase ${sideColor(p.side)}`}>{p.side}</span>
                        <span className="font-mono text-sm text-zinc-200">{p.symbol}</span>
                        <span className="text-xs text-zinc-500">{p.leverage}x</span>
                      </div>
                      <span className={`font-mono text-sm font-semibold ${p.unrealizedPnl >= 0 ? "text-emerald-400" : "text-red-400"}`}>
                        {fmtUsd(p.unrealizedPnl)}
                      </span>
                    </div>
                    <div className="grid grid-cols-4 gap-3 text-[10px]">
                      {[
                        { label: "Entry", value: fmt(p.entryPrice, 2) },
                        { label: "Mark", value: fmt(p.markPrice, 2) },
                        { label: "Qty", value: fmt(p.qty, 4) },
                        { label: "Liq.", value: p.liqPrice ? fmt(p.liqPrice, 2) : "—" },
                      ].map(s => (
                        <div key={s.label}>
                          <p className="uppercase tracking-wide text-zinc-600">{s.label}</p>
                          <p className="font-mono text-zinc-300 mt-0.5">{s.value}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TP/SL orders */}
          {snapshot.openOrders.length > 0 && (
            <div>
              <p className="mb-2 text-xs font-medium text-zinc-400">Active TP/SL Orders ({snapshot.openOrders.length})</p>
              <div className="space-y-1.5">
                {snapshot.openOrders.map((o) => (
                  <div key={o.orderId} className="flex items-center justify-between rounded-lg bg-surface-2 px-3 py-2">
                    <div className="flex items-center gap-2">
                      <Badge variant={o.planType === "profit_plan" ? "success" : "danger"}>
                        {o.planType === "profit_plan" ? "TP" : "SL"}
                      </Badge>
                      <span className="text-xs text-zinc-400">{o.side}</span>
                    </div>
                    <div className="flex items-center gap-4">
                      <span className="font-mono text-xs text-zinc-300">{fmt(o.triggerPrice, 2)}</span>
                      <span className="font-mono text-xs text-zinc-500">qty {fmt(o.size, 4)}</span>
                      <Badge variant="muted">{o.status}</Badge>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {snapshot.isReal && snapshot.positions.length === 0 && snapshot.openOrders.length === 0 && (
            <p className="text-center text-xs text-zinc-600 py-4">No open positions or orders on Bitget</p>
          )}
        </>
      )}
    </div>
  );
}
