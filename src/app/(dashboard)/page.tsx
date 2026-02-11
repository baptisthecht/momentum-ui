import { getSessions, getRunningSessions, getTrades } from "@/lib/api";
import { Card, CardHeader, CardTitle, Stat, StatusDot, Badge, EmptyState } from "@/components/ui/shared";
import { fmtUsd, fmtPct, fmtDate, pnlColor, sideColor } from "@/lib/utils";
import type { Session, Trade } from "@/types/api";
import Link from "next/link";

export default async function DashboardPage() {
  let sessions: Session[] = [];
  let running: Session[] = [];
  let recentTrades: Trade[] = [];

  try {
    [sessions, running] = await Promise.all([getSessions(), getRunningSessions()]);
    if (running.length > 0) {
      recentTrades = await getTrades(running[0].id, 10);
    } else if (sessions.length > 0) {
      recentTrades = await getTrades(sessions[0].id, 10);
    }
  } catch {}

  const totalPnl = recentTrades.reduce((s, t) => s + t.pnl, 0);
  const winRate = recentTrades.length > 0
    ? (recentTrades.filter((t) => t.pnl > 0).length / recentTrades.length) * 100
    : 0;
  const activeSession = running[0];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-zinc-100">Dashboard</h1>
          <p className="text-xs text-zinc-500 mt-0.5">Real-time bot monitoring</p>
        </div>
        {activeSession && (
          <div className="flex items-center gap-2 rounded-lg border border-emerald-500/20 bg-emerald-500/5 px-3 py-2">
            <StatusDot status="running" />
            <span className="text-xs font-medium text-emerald-400">Bot active — {activeSession.symbol}</span>
          </div>
        )}
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Card>
          <Stat label="Active Sessions" value={String(running.length)} sub={`${sessions.length} total`} />
        </Card>
        <Card>
          <Stat
            label="Balance"
            value={activeSession ? fmtUsd(activeSession.currentBalance) : "—"}
            sub={activeSession ? `Started ${fmtUsd(activeSession.startingBalance)}` : undefined}
            trend={activeSession && activeSession.currentBalance > activeSession.startingBalance ? "up" : activeSession && activeSession.currentBalance < activeSession.startingBalance ? "down" : "neutral"}
          />
        </Card>
        <Card>
          <Stat label="Recent P&L" value={fmtUsd(totalPnl)} trend={totalPnl > 0 ? "up" : totalPnl < 0 ? "down" : "neutral"} />
        </Card>
        <Card>
          <Stat label="Win Rate" value={`${winRate.toFixed(0)}%`} sub={`${recentTrades.length} trades`} />
        </Card>
      </div>

      {/* Running sessions */}
      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Running Sessions</CardTitle>
            <Link href="/bot" className="text-xs text-accent hover:text-accent-hover">View all →</Link>
          </CardHeader>
          {running.length === 0 ? (
            <EmptyState icon="◇" title="No active sessions" description="Start a session in Bot Monitor" />
          ) : (
            <div className="space-y-3">
              {running.map((s) => (
                <Link key={s.id} href={`/bot/${s.id}`} className="flex items-center justify-between rounded-lg border border-border bg-surface-2 px-4 py-3 transition hover:border-accent/30">
                  <div className="flex items-center gap-3">
                    <StatusDot status="running" />
                    <div>
                      <span className="font-mono text-sm font-medium text-zinc-200">{s.symbol}</span>
                      <span className="ml-2 text-xs text-zinc-500">{s.leverage}x</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-mono text-sm text-zinc-200">{fmtUsd(s.currentBalance)}</p>
                    <p className={`text-xs ${pnlColor(s.currentBalance - s.startingBalance)}`}>
                      {fmtPct(((s.currentBalance - s.startingBalance) / s.startingBalance) * 100)}
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </Card>

        {/* Recent trades */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Trades</CardTitle>
            <Link href="/trades" className="text-xs text-accent hover:text-accent-hover">All trades →</Link>
          </CardHeader>
          {recentTrades.length === 0 ? (
            <EmptyState icon="⇄" title="No trades yet" description="The bot will log trades here" />
          ) : (
            <div className="space-y-1.5">
              {recentTrades.slice(0, 6).map((t) => (
                <div key={t.id} className="flex items-center justify-between rounded-lg bg-surface-2 px-3 py-2">
                  <div className="flex items-center gap-2.5">
                    <span className={`font-mono text-xs font-bold uppercase ${sideColor(t.side)}`}>{t.side}</span>
                    <span className="font-mono text-xs text-zinc-400">{t.symbol}</span>
                  </div>
                  <div className="flex items-center gap-4">
                    <Badge variant={t.reason?.includes("stop") ? "danger" : "success"}>{t.reason ?? "close"}</Badge>
                    <span className={`font-mono text-sm font-medium ${pnlColor(t.pnl)}`}>{fmtUsd(t.pnl)}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
