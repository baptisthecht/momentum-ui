"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";

interface Strategy { id: string; name: string; isDefault: boolean; }
interface LiveBalance { available: number; equity: number; }

export function StartSessionModal({ onClose }: { onClose: () => void }) {
  const router = useRouter();
  const [strategies, setStrategies] = useState<Strategy[]>([]);
  const [liveBalance, setLiveBalance] = useState<LiveBalance | null>(null);
  const [loadingBalance, setLoadingBalance] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [simulation, setSimulation] = useState(true);
  const [showAdvanced, setShowAdvanced] = useState(false);

  useEffect(() => {
    fetch("/api/proxy/strategies").then(r => r.json()).then(setStrategies).catch(() => {});
  }, []);

  // Fetch live Bitget balance when switching to real mode
  useEffect(() => {
    if (!simulation && !liveBalance) {
      setLoadingBalance(true);
      fetch("/api/proxy/users/me/balance")
        .then(r => r.json())
        .then(d => setLiveBalance({ available: d.available ?? 0, equity: d.equity ?? 0 }))
        .catch(() => {})
        .finally(() => setLoadingBalance(false));
    }
  }, [simulation, liveBalance]);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(""); setLoading(true);
    const form = new FormData(e.currentTarget);
    const payload: any = {
      symbol: (form.get("symbol") as string).toUpperCase().trim(),
      strategyId: form.get("strategyId") || undefined,
      leverage: parseInt(form.get("leverage") as string) || 35,
      simulation,
      startingBalance: parseFloat(form.get("startingBalance") as string) || 1000,
    };
    // Risk overrides
    const risk = form.get("riskPerTradePct"); if (risk) payload.riskPerTradePct = parseFloat(risk as string) / 100;
    const maxN = form.get("maxNotionalUsdt"); if (maxN) payload.maxNotionalUsdt = parseFloat(maxN as string);
    const minP = form.get("minProfitUsdt"); if (minP) payload.minProfitUsdt = parseFloat(minP as string);
    const maxR = form.get("maxRiskPerTradeUsdt"); if (maxR) payload.maxRiskPerTradeUsdt = parseFloat(maxR as string);
    const capF = form.get("capitalFraction"); if (capF) payload.capitalFraction = parseFloat(capF as string) / 100;
    const maxDLP = form.get("maxDailyLossPct"); if (maxDLP) payload.maxDailyLossPct = parseFloat(maxDLP as string);
    const maxDLU = form.get("maxDailyLossUsdt"); if (maxDLU) payload.maxDailyLossUsdt = parseFloat(maxDLU as string);
    const maxT = form.get("maxTradesPerDay"); if (maxT) payload.maxTradesPerDay = parseInt(maxT as string);
    const maxC = form.get("maxConsecutiveLosses"); if (maxC) payload.maxConsecutiveLosses = parseInt(maxC as string);

    try {
      const res = await fetch("/api/proxy/sessions/start", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        throw new Error(d.message ?? "Failed to start session");
      }
      const session = await res.json();
      router.push(`/bot/${session.id}`);
      router.refresh();
      onClose();
    } catch (err: any) {
      setError(err.message);
    } finally { setLoading(false); }
  }

  const inp = "w-full rounded-lg border border-border bg-surface-2 px-3 py-2 text-sm text-zinc-200 outline-none transition focus:border-accent focus:ring-1 focus:ring-accent/30";
  const label = "block text-xs text-zinc-500 mb-1.5";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="w-full max-w-lg rounded-xl border border-border bg-surface-1 shadow-2xl overflow-y-auto max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border px-6 py-4">
          <div>
            <h2 className="text-sm font-semibold text-zinc-100">Start New Session</h2>
            <p className="text-xs text-zinc-500 mt-0.5">Configure trading parameters</p>
          </div>
          <button onClick={onClose} className="text-zinc-500 hover:text-zinc-300 text-lg">✕</button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {/* Mode toggle */}
          <div className="flex rounded-lg border border-border bg-surface-2 p-1">
            {[{ v: true, label: "Simulation", desc: "Paper trading" }, { v: false, label: "Real", desc: "Live orders" }].map(m => (
              <button key={String(m.v)} type="button"
                onClick={() => setSimulation(m.v)}
                className={cn("flex-1 rounded-md py-2 text-xs font-medium transition-all",
                  simulation === m.v ? "bg-accent/20 text-accent" : "text-zinc-500 hover:text-zinc-300")}>
                {m.label}
                <span className="ml-1 text-[10px] opacity-60">{m.desc}</span>
              </button>
            ))}
          </div>

          {/* Real mode warning + live balance */}
          {!simulation && (
            <div className="rounded-lg border border-amber-500/20 bg-amber-500/5 px-4 py-3 space-y-2">
              <p className="text-xs font-medium text-amber-400">⚠ Real mode — live orders will be placed on Bitget</p>
              {loadingBalance ? (
                <p className="text-xs text-zinc-500 animate-pulse">Fetching Bitget balance…</p>
              ) : liveBalance ? (
                <p className="text-xs text-zinc-400">
                  Bitget balance: <span className="font-mono text-emerald-400">${liveBalance.available.toFixed(2)}</span>
                  {" · "}Equity: <span className="font-mono text-zinc-200">${liveBalance.equity.toFixed(2)}</span>
                </p>
              ) : (
                <p className="text-xs text-red-400">Could not fetch balance — ensure API keys are configured in Settings</p>
              )}
            </div>
          )}

          {/* Core params */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={label}>Symbol</label>
              <input name="symbol" required className={inp} placeholder="BTCUSDT" defaultValue="BTCUSDT" />
            </div>
            <div>
              <label className={label}>Leverage</label>
              <input name="leverage" type="number" min={1} max={125} className={inp} defaultValue={35} />
            </div>
          </div>

          <div>
            <label className={label}>Strategy</label>
            <select name="strategyId" className={inp}>
              <option value="">Default strategy</option>
              {strategies.map(s => <option key={s.id} value={s.id}>{s.name}{s.isDefault ? " (default)" : ""}</option>)}
            </select>
          </div>

          <div>
            <label className={label}>
              Starting balance (USDT)
              {!simulation && liveBalance && (
                <button type="button"
                  onClick={() => {
                    const el = document.querySelector<HTMLInputElement>('[name="startingBalance"]');
                    if (el) el.value = liveBalance.available.toFixed(2);
                  }}
                  className="ml-2 text-accent hover:text-accent-hover">
                  Use live balance (${liveBalance.available.toFixed(2)})
                </button>
              )}
            </label>
            <input name="startingBalance" type="number" step="0.01" min={1} className={inp} defaultValue={1000} />
          </div>

          {/* Advanced toggle */}
          <button type="button" onClick={() => setShowAdvanced(!showAdvanced)}
            className="flex items-center gap-2 text-xs text-zinc-500 hover:text-zinc-300 transition-colors">
            <span className={cn("transition-transform", showAdvanced ? "rotate-90" : "")}>▶</span>
            Advanced risk parameters
          </button>

          {showAdvanced && (
            <div className="space-y-4 rounded-lg border border-border-subtle bg-surface-2 p-4">
              <p className="text-xs text-zinc-500 font-medium">Overrides strategy defaults when set</p>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={label}>Risk per trade (%)</label>
                  <input name="riskPerTradePct" type="number" step="0.1" min={0.1} max={100} className={inp} placeholder="e.g. 10" />
                </div>
                <div>
                  <label className={label}>Max risk/trade (USDT)</label>
                  <input name="maxRiskPerTradeUsdt" type="number" step="1" className={inp} placeholder="0 = disabled" />
                </div>
                <div>
                  <label className={label}>Max notional (USDT)</label>
                  <input name="maxNotionalUsdt" type="number" step="1" className={inp} placeholder="e.g. 1000" />
                </div>
                <div>
                  <label className={label}>Min profit/trade (USDT)</label>
                  <input name="minProfitUsdt" type="number" step="0.1" className={inp} placeholder="e.g. 4" />
                </div>
                <div>
                  <label className={label}>Capital fraction (%)</label>
                  <input name="capitalFraction" type="number" step="1" min={1} max={100} className={inp} placeholder="100 = all" />
                </div>
              </div>

              <div className="border-t border-border-subtle pt-4">
                <p className="text-xs text-zinc-500 font-medium mb-3">Daily risk limits</p>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className={label}>Max daily loss (%)</label>
                    <input name="maxDailyLossPct" type="number" step="0.5" className={inp} placeholder="e.g. 30" />
                  </div>
                  <div>
                    <label className={label}>Max daily loss (USDT)</label>
                    <input name="maxDailyLossUsdt" type="number" step="1" className={inp} placeholder="e.g. 60" />
                  </div>
                  <div>
                    <label className={label}>Max trades/day</label>
                    <input name="maxTradesPerDay" type="number" step="1" className={inp} placeholder="e.g. 25" />
                  </div>
                  <div>
                    <label className={label}>Max consecutive losses</label>
                    <input name="maxConsecutiveLosses" type="number" step="1" className={inp} placeholder="e.g. 4" />
                  </div>
                </div>
              </div>
            </div>
          )}

          {error && <p className="text-xs text-red-400">{error}</p>}

          <div className="flex gap-3 pt-1">
            <button type="button" onClick={onClose}
              className="flex-1 rounded-lg border border-border py-2.5 text-sm text-zinc-400 transition hover:border-zinc-500">
              Cancel
            </button>
            <button type="submit" disabled={loading}
              className={cn("flex-1 rounded-lg py-2.5 text-sm font-medium text-white transition disabled:opacity-50",
                simulation ? "bg-accent hover:bg-accent-hover" : "bg-emerald-600 hover:bg-emerald-500")}>
              {loading ? "Starting…" : simulation ? "Start Simulation" : "Start Live Trading"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
