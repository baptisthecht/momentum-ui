"use client";
import { useState, useEffect } from "react";
import { Card, CardHeader, CardTitle, StatusDot, Badge, EmptyState } from "@/components/ui/shared";
import { fmtUsd, fmtPct, fmtDate } from "@/lib/utils";
import Link from "next/link";
import { StartSessionModal } from "./_components/start-session-modal";

interface Session {
  id: string; symbol: string; leverage: number; status: string; simulation: boolean;
  startingBalance: number; currentBalance: number; currentEquity: number; createdAt: string;
  killSwitchTriggered?: boolean; riskMultiplier?: number;
}

export default function BotPage() {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);

  async function load() {
    setLoading(true);
    try {
      const res = await fetch("/api/proxy/sessions");
      if (res.ok) setSessions(await res.json());
    } finally { setLoading(false); }
  }

  useEffect(() => { load(); }, []);

  const running = sessions.filter(s => s.status === "running");
  const stopped = sessions.filter(s => s.status === "stopped");

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-zinc-100">Bot Monitor</h1>
          <p className="text-xs text-zinc-500 mt-0.5">Manage trading sessions</p>
        </div>
        <button onClick={() => setShowModal(true)}
          className="flex items-center gap-2 rounded-lg bg-accent px-4 py-2 text-sm font-medium text-white transition hover:bg-accent-hover">
          + New Session
        </button>
      </div>

      {loading ? (
        <div className="space-y-3">
          {[1,2,3].map(i => <div key={i} className="h-28 rounded-xl bg-surface-1 animate-pulse" />)}
        </div>
      ) : (
        <>
          {/* Running */}
          <div>
            <h2 className="mb-3 flex items-center gap-2 text-sm font-medium text-zinc-400">
              <StatusDot status="running" /> Running Sessions ({running.length})
            </h2>
            {running.length === 0 ? (
              <Card>
                <EmptyState icon="⬡" title="No active sessions"
                  description="Start a new session to begin trading" />
                <div className="flex justify-center pb-2">
                  <button onClick={() => setShowModal(true)}
                    className="rounded-lg bg-accent px-6 py-2 text-sm font-medium text-white transition hover:bg-accent-hover">
                    Start your first session
                  </button>
                </div>
              </Card>
            ) : (
              <div className="grid gap-3 lg:grid-cols-2">
                {running.map(s => <SessionCard key={s.id} session={s} onRefresh={load} />)}
              </div>
            )}
          </div>

          {stopped.length > 0 && (
            <div>
              <h2 className="mb-3 text-sm font-medium text-zinc-500">Session History ({stopped.length})</h2>
              <div className="grid gap-3 lg:grid-cols-2 xl:grid-cols-3">
                {stopped.map(s => <SessionCard key={s.id} session={s} onRefresh={load} />)}
              </div>
            </div>
          )}
        </>
      )}

      {showModal && <StartSessionModal onClose={() => { setShowModal(false); load(); }} />}
    </div>
  );
}

function SessionCard({ session: s, onRefresh }: { session: Session; onRefresh: () => void }) {
  const [stopping, setStopping] = useState(false);
  const [confirm, setConfirm] = useState(false);
  const pnl = s.currentBalance - s.startingBalance;
  const pnlPct = (pnl / s.startingBalance) * 100;
  const isRunning = s.status === "running";

  async function stop(e: React.MouseEvent) {
    e.preventDefault();
    setStopping(true);
    await fetch(`/api/proxy/sessions/${s.id}/stop`, { method: "POST" });
    setStopping(false); setConfirm(false);
    onRefresh();
  }

  return (
    <div className="relative">
      <Link href={`/bot/${s.id}`} className="group block">
        <Card className="transition hover:border-accent/30">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2.5">
              <StatusDot status={isRunning ? "running" : "stopped"} />
              <span className="font-mono text-sm font-semibold text-zinc-100">{s.symbol}</span>
              <Badge variant={s.simulation ? "warning" : "muted"}>{s.simulation ? "SIM" : "REAL"}</Badge>
              {s.killSwitchTriggered && <Badge variant="danger">KILL</Badge>}
            </div>
            <span className="font-mono text-xs text-zinc-500">{s.leverage}x</span>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <p className="text-[10px] uppercase tracking-wide text-zinc-600">Balance</p>
              <p className="mt-0.5 font-mono text-sm text-zinc-200">{fmtUsd(s.currentBalance)}</p>
            </div>
            <div>
              <p className="text-[10px] uppercase tracking-wide text-zinc-600">P&L</p>
              <p className={`mt-0.5 font-mono text-sm ${pnl >= 0 ? "text-emerald-400" : "text-red-400"}`}>{fmtUsd(pnl)}</p>
            </div>
            <div>
              <p className="text-[10px] uppercase tracking-wide text-zinc-600">Return</p>
              <p className={`mt-0.5 font-mono text-sm ${pnlPct >= 0 ? "text-emerald-400" : "text-red-400"}`}>{fmtPct(pnlPct)}</p>
            </div>
          </div>

          {s.riskMultiplier !== undefined && s.riskMultiplier < 1 && (
            <div className="mt-2 flex items-center gap-1.5 rounded bg-amber-500/10 px-2 py-1">
              <span className="text-[10px] text-amber-400">Risk reduced to {(s.riskMultiplier * 100).toFixed(0)}% (drawdown protection)</span>
            </div>
          )}

          <div className="mt-3 flex items-center justify-between border-t border-border-subtle pt-2.5">
            <p className="text-[10px] text-zinc-600">Started {fmtDate(s.createdAt)}</p>
            <span className="text-xs text-accent opacity-0 transition group-hover:opacity-100">View →</span>
          </div>
        </Card>
      </Link>

      {/* Stop button overlay */}
      {isRunning && (
        <div className="absolute right-4 top-4 z-10" onClick={e => e.preventDefault()}>
          {!confirm ? (
            <button onClick={() => setConfirm(true)}
              className="rounded-md border border-red-500/20 bg-surface-1 px-2 py-1 text-[10px] text-red-400 opacity-0 transition hover:border-red-500/50 hover:bg-red-500/10 group-hover:opacity-100">
              Stop
            </button>
          ) : (
            <div className="flex items-center gap-1 rounded-md border border-red-500/30 bg-surface-0 px-2 py-1">
              <button onClick={stop} disabled={stopping}
                className="text-[10px] font-medium text-red-400 hover:text-red-300 disabled:opacity-50">
                {stopping ? "…" : "Confirm"}
              </button>
              <span className="text-zinc-600">·</span>
              <button onClick={() => setConfirm(false)} className="text-[10px] text-zinc-500 hover:text-zinc-300">Cancel</button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
