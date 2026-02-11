import { getSessions, getRunningSessions } from "@/lib/api";
import { Card, CardHeader, CardTitle, StatusDot, Badge, EmptyState } from "@/components/ui/shared";
import { fmtUsd, fmtPct, fmtDate } from "@/lib/utils";
import type { Session } from "@/types/api";
import Link from "next/link";

export default async function BotPage() {
  let sessions: Session[] = [];
  try { sessions = await getSessions(); } catch {}

  const running = sessions.filter((s) => s.status === "running");
  const stopped = sessions.filter((s) => s.status === "stopped");

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-zinc-100">Bot Monitor</h1>
          <p className="text-xs text-zinc-500 mt-0.5">Monitor signal evaluations and manage sessions</p>
        </div>
      </div>

      {/* Running */}
      <div>
        <h2 className="mb-3 flex items-center gap-2 text-sm font-medium text-zinc-400">
          <StatusDot status="running" /> Running Sessions
        </h2>
        {running.length === 0 ? (
          <Card><EmptyState icon="⬡" title="No active sessions" description="Start a new session to begin trading" /></Card>
        ) : (
          <div className="grid gap-3 lg:grid-cols-2">
            {running.map((s) => <SessionCard key={s.id} session={s} />)}
          </div>
        )}
      </div>

      {/* History */}
      {stopped.length > 0 && (
        <div>
          <h2 className="mb-3 text-sm font-medium text-zinc-500">Session History</h2>
          <div className="grid gap-3 lg:grid-cols-2 xl:grid-cols-3">
            {stopped.map((s) => <SessionCard key={s.id} session={s} />)}
          </div>
        </div>
      )}
    </div>
  );
}

function SessionCard({ session: s }: { session: Session }) {
  const pnl = s.currentBalance - s.startingBalance;
  const pnlPct = (pnl / s.startingBalance) * 100;
  const isRunning = s.status === "running";

  return (
    <Link href={`/bot/${s.id}`} className="group">
      <Card className="transition hover:border-accent/30">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2.5">
            <StatusDot status={isRunning ? "running" : "stopped"} />
            <span className="font-mono text-sm font-semibold text-zinc-100">{s.symbol}</span>
            <Badge variant={s.simulation ? "warning" : "muted"}>{s.simulation ? "SIM" : "REAL"}</Badge>
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
            <p className={`mt-0.5 font-mono text-sm ${pnl >= 0 ? "text-emerald-400" : "text-red-400"}`}>
              {fmtUsd(pnl)}
            </p>
          </div>
          <div>
            <p className="text-[10px] uppercase tracking-wide text-zinc-600">Return</p>
            <p className={`mt-0.5 font-mono text-sm ${pnlPct >= 0 ? "text-emerald-400" : "text-red-400"}`}>
              {fmtPct(pnlPct)}
            </p>
          </div>
        </div>

        <div className="mt-3 flex items-center justify-between border-t border-border-subtle pt-2.5">
          <p className="text-[10px] text-zinc-600">Started {fmtDate(s.createdAt)}</p>
          <span className="text-xs text-accent opacity-0 transition group-hover:opacity-100">View details →</span>
        </div>
      </Card>
    </Link>
  );
}
