import { getSession, getEvaluations, getTrades, getEvalStats, getPositionsWithPnl } from "@/lib/api";
import { Card, CardHeader, CardTitle, Badge, StatusDot, Stat, EmptyState, Table, Th, Td } from "@/components/ui/shared";
import { fmtUsd, fmtPct, fmtDate, fmt, pnlColor, sideColor } from "@/lib/utils";
import type { Session, SignalEvaluation, Trade } from "@/types/api";
import { EvaluationTimeline } from "./_components/eval-timeline";
import { PositionTable } from "./_components/position-table";
import { LiveSyncPanel } from "../_components/live-sync-panel";
import { StopSessionBtn } from "../_components/stop-session-btn";

interface Props { params: Promise<{ sessionId: string }> }

export default async function SessionDetailPage({ params }: Props) {
  const { sessionId } = await params;

  let session: Session | null = null;
  let evaluations: SignalEvaluation[] = [];
  let trades: Trade[] = [];
  let evalStats: any = { total: 0, signals: 0, rejected: 0, longSignals: 0, shortSignals: 0 };
  let positions: any[] = [];

  try {
    [session, evaluations, trades, evalStats, positions] = await Promise.all([
      getSession(sessionId),
      getEvaluations(sessionId, 100),
      getTrades(sessionId, 200),
      getEvalStats(sessionId),
      getPositionsWithPnl(sessionId),
    ]);
  } catch {}

  if (!session) return <EmptyState icon="?" title="Session not found" description="This session may not exist or you lack access." />;

  const pnl = session.currentBalance - session.startingBalance;
  const pnlPct = (pnl / session.startingBalance) * 100;
  const isRunning = session.status === "running";

  const tradeWins = trades.filter(t => t.pnl > 0).length;
  const tradeLosses = trades.filter(t => t.pnl < 0).length;
  const tradeWinRate = trades.length > 0 ? (tradeWins / trades.length) * 100 : 0;

  const closedPositions = positions.filter(p => p.isClosed);
  const openPositions = positions.filter(p => !p.isClosed);
  const posWins = closedPositions.filter(p => p.isWin).length;
  const posWinRate = closedPositions.length > 0 ? (posWins / closedPositions.length) * 100 : 0;
  const totalPosPnl = closedPositions.reduce((s, p) => s + p.totalPnl, 0);
  const avgWin = posWins > 0 ? closedPositions.filter(p => p.isWin).reduce((s, p) => s + p.totalPnl, 0) / posWins : 0;
  const avgLoss = closedPositions.filter(p => !p.isWin).length > 0
    ? closedPositions.filter(p => !p.isWin).reduce((s, p) => s + p.totalPnl, 0) / closedPositions.filter(p => !p.isWin).length : 0;
  const profitFactor = Math.abs(avgLoss) > 0 ? Math.abs(avgWin / avgLoss) : null;

  // Risk state
  const sess = session as any;
  const hasRiskState = sess.tradesToday !== undefined;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <StatusDot status={isRunning ? "running" : "stopped"} />
          <h1 className="font-mono text-xl font-semibold text-zinc-100">{session.symbol}</h1>
          <Badge variant={session.simulation ? "warning" : "muted"}>{session.simulation ? "SIMULATION" : "REAL"}</Badge>
          <span className="text-xs text-zinc-500">{session.leverage}x</span>
          {sess.killSwitchTriggered && <Badge variant="danger">KILL SWITCH</Badge>}
          {sess.riskMultiplier < 1 && <Badge variant="warning">Risk ×{sess.riskMultiplier?.toFixed(2)}</Badge>}
        </div>
        {isRunning && <StopSessionBtn sessionId={sessionId} />}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Card><Stat label="Balance" value={fmtUsd(session.currentBalance)} sub={`Started ${fmtUsd(session.startingBalance)}`} /></Card>
        <Card><Stat label="P&L" value={fmtUsd(pnl)} trend={pnl >= 0 ? "up" : "down"} sub={fmtPct(pnlPct)} /></Card>
        <Card><Stat label="Open Positions" value={String(openPositions.length)} /></Card>
        <Card><Stat label="Closed Positions" value={String(closedPositions.length)} /></Card>
      </div>

      {/* Risk state (if available) */}
      {hasRiskState && (
        <Card>
          <CardHeader><CardTitle>Risk State</CardTitle></CardHeader>
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            {[
              { label: "Trades today", value: String(sess.tradesToday ?? 0) },
              { label: "Consecutive losses", value: String(sess.consecutiveLosses ?? 0) },
              { label: "Risk multiplier", value: `×${(sess.riskMultiplier ?? 1).toFixed(2)}`,
                color: sess.riskMultiplier < 1 ? "text-amber-400" : "text-zinc-100" },
              { label: "Daily P&L", value: fmtUsd(sess.dailyPnl ?? 0),
                color: (sess.dailyPnl ?? 0) >= 0 ? "text-emerald-400" : "text-red-400" },
            ].map(s => (
              <div key={s.label}>
                <p className="text-[10px] uppercase tracking-wide text-zinc-600">{s.label}</p>
                <p className={`mt-0.5 font-mono text-lg font-semibold ${s.color ?? "text-zinc-100"}`}>{s.value}</p>
              </div>
            ))}
          </div>
          {sess.killSwitchTriggered && (
            <div className="mt-3 rounded-lg border border-red-500/30 bg-red-500/5 px-4 py-2">
              <p className="text-xs font-medium text-red-400">Kill switch is active — trading halted for this session</p>
            </div>
          )}
        </Card>
      )}

      {/* Live Bitget sync (real sessions only) */}
      {!session.simulation && (
        <Card>
          <CardHeader><CardTitle>Live Bitget</CardTitle></CardHeader>
          <LiveSyncPanel sessionId={sessionId} />
        </Card>
      )}

      {/* Win Rate */}
      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardTitle className="mb-3">Trade Stats</CardTitle>
          <div className="grid grid-cols-3 gap-4">
            <div><p className="text-[10px] uppercase tracking-wide text-zinc-600">Win Rate</p><p className="mt-0.5 text-lg font-semibold text-zinc-100">{tradeWinRate.toFixed(0)}%</p></div>
            <div><p className="text-[10px] uppercase tracking-wide text-zinc-600">W / L</p>
              <p className="mt-0.5 text-lg font-semibold"><span className="text-emerald-400">{tradeWins}</span><span className="text-zinc-600 mx-1">/</span><span className="text-red-400">{tradeLosses}</span></p></div>
            <div><p className="text-[10px] uppercase tracking-wide text-zinc-600">Total</p><p className="mt-0.5 text-lg font-semibold text-zinc-100">{trades.length}</p></div>
          </div>
          <div className="mt-3 h-2 w-full rounded-full bg-surface-3 overflow-hidden">
            <div className="h-full rounded-full bg-emerald-500" style={{ width: `${tradeWinRate}%` }} />
          </div>
        </Card>
        <Card>
          <CardTitle className="mb-3">Position Stats</CardTitle>
          <div className="grid grid-cols-3 gap-4">
            <div><p className="text-[10px] uppercase tracking-wide text-zinc-600">Win Rate</p><p className="mt-0.5 text-lg font-semibold text-zinc-100">{posWinRate.toFixed(0)}%</p></div>
            <div><p className="text-[10px] uppercase tracking-wide text-zinc-600">Avg W / L</p>
              <p className="mt-0.5 text-sm font-mono">
                <span className="text-emerald-400">{fmtUsd(avgWin)}</span><span className="text-zinc-600 mx-1">/</span><span className="text-red-400">{fmtUsd(avgLoss)}</span>
              </p></div>
            <div><p className="text-[10px] uppercase tracking-wide text-zinc-600">Profit Factor</p>
              <p className={`mt-0.5 text-lg font-semibold ${profitFactor && profitFactor > 1 ? "text-emerald-400" : "text-red-400"}`}>
                {profitFactor ? profitFactor.toFixed(2) : "—"}
              </p></div>
          </div>
          <div className="mt-3 h-2 w-full rounded-full bg-surface-3 overflow-hidden">
            <div className="h-full rounded-full bg-emerald-500" style={{ width: `${posWinRate}%` }} />
          </div>
        </Card>
      </div>

      {/* Signal stats */}
      <Card>
        <CardTitle className="mb-3">Signal Evaluation Stats</CardTitle>
        <div className="grid grid-cols-2 gap-6 lg:grid-cols-5">
          {[
            { label: "Total Candles", value: evalStats.total, cls: "" },
            { label: "Signals", value: evalStats.signals, cls: "text-emerald-400",
              sub: evalStats.total > 0 ? `${((evalStats.signals / evalStats.total) * 100).toFixed(1)}% rate` : "" },
            { label: "Long / Short", value: null, long: evalStats.longSignals, short: evalStats.shortSignals },
            { label: "Rejected", value: evalStats.rejected, cls: "text-zinc-500" },
          ].map((s, i) => (
            <div key={i}>
              <p className="text-[10px] uppercase tracking-wide text-zinc-600">{s.label}</p>
              {s.value !== null && s.value !== undefined
                ? <p className={`mt-0.5 text-xl font-semibold ${s.cls || "text-zinc-100"}`}>{s.value}</p>
                : <p className="mt-0.5 text-lg font-semibold"><span className="text-emerald-400">{s.long}</span><span className="text-zinc-600 mx-1">/</span><span className="text-red-400">{s.short}</span></p>}
              {s.sub && <p className="text-[10px] text-zinc-600">{s.sub}</p>}
            </div>
          ))}
        </div>
      </Card>

      {openPositions.length > 0 && (
        <Card><CardHeader><CardTitle>Open Positions</CardTitle></CardHeader><PositionTable positions={openPositions} showPnl={false} /></Card>
      )}

      {closedPositions.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Closed Positions</CardTitle>
            <span className={`font-mono text-sm font-semibold ${pnlColor(totalPosPnl)}`}>{fmtUsd(totalPosPnl)} total</span>
          </CardHeader>
          <PositionTable positions={closedPositions} showPnl={true} />
        </Card>
      )}

      <Card>
        <CardHeader><CardTitle>Signal Evaluations</CardTitle></CardHeader>
        <EvaluationTimeline evaluations={evaluations} sessionId={sessionId} />
      </Card>

      {trades.length > 0 && (
        <Card>
          <CardHeader><CardTitle>Trade History</CardTitle></CardHeader>
          <Table>
            <thead>
              <tr><Th>Time</Th><Th>Side</Th><Th>Entry</Th><Th>Exit</Th><Th>Qty</Th><Th>P&L</Th><Th>Fees</Th><Th>Reason</Th></tr>
            </thead>
            <tbody>
              {trades.map(t => (
                <tr key={t.id} className="border-t border-border-subtle">
                  <Td className="text-xs text-zinc-500 whitespace-nowrap">{t.closeTime ? fmtDate(t.closeTime) : "—"}</Td>
                  <Td><span className={`font-mono text-xs font-bold uppercase ${sideColor(t.side)}`}>{t.side}</span></Td>
                  <Td className="font-mono">{fmt(t.entryPrice, 2)}</Td>
                  <Td className="font-mono">{t.exitPrice ? fmt(t.exitPrice, 2) : "—"}</Td>
                  <Td className="font-mono text-xs">{fmt(t.qty, 6)}</Td>
                  <Td className={`font-mono font-medium ${pnlColor(t.pnl)}`}>{fmtUsd(t.pnl)}</Td>
                  <Td className="font-mono text-xs text-zinc-500">{fmtUsd(t.fees)}</Td>
                  <Td>
                    <Badge variant={t.reason?.includes("stop") ? "danger" : t.reason === "external_closure" ? "warning" : "success"}>
                      {t.reason ?? "close"}
                    </Badge>
                  </Td>
                </tr>
              ))}
            </tbody>
          </Table>
        </Card>
      )}
    </div>
  );
}
