import { getSession, getEvaluations, getTrades, getEvalStats, getPositionsWithPnl } from "@/lib/api";
import { Card, CardHeader, CardTitle, Badge, StatusDot, Stat, EmptyState, Table, Th, Td } from "@/components/ui/shared";
import { fmtUsd, fmtPct, fmtDate, fmtTime, fmt, pnlColor, sideColor } from "@/lib/utils";
import type { Session, SignalEvaluation, Trade } from "@/types/api";
import { EvaluationTimeline } from "./_components/eval-timeline";
import { PositionTable } from "./_components/position-table";

interface Props { params: Promise<{ sessionId: string }> }

interface PositionWithPnl {
  id: string; symbol: string; side: string; entryPrice: number; sl: number; tp: number;
  leverage: number; originalQty: number; qty: number; isClosed: boolean;
  openTime: string; trailingActive: boolean; bestPrice: number; riskAmount: number;
  totalPnl: number; totalFees: number; netPnl: number; tradeCount: number; isWin: boolean;
  tpTargets: any[]; trades: any[];
}

interface EvalStats {
  total: number; signals: number; rejected: number; longSignals: number; shortSignals: number;
}

export default async function SessionDetailPage({ params }: Props) {
  const { sessionId } = await params;

  let session: Session | null = null;
  let evaluations: SignalEvaluation[] = [];
  let trades: Trade[] = [];
  let evalStats: EvalStats = { total: 0, signals: 0, rejected: 0, longSignals: 0, shortSignals: 0 };
  let positions: PositionWithPnl[] = [];

  try {
    [session, evaluations, trades, evalStats, positions] = await Promise.all([
      getSession(sessionId),
      getEvaluations(sessionId, 100),
      getTrades(sessionId, 200),
      getEvalStats(sessionId),
      getPositionsWithPnl(sessionId),
    ]);
  } catch {}

  if (!session) {
    return <EmptyState icon="?" title="Session not found" description="This session may not exist or you lack access." />;
  }

  const pnl = session.currentBalance - session.startingBalance;
  const pnlPct = (pnl / session.startingBalance) * 100;

  // Trade stats
  const tradeWins = trades.filter((t) => t.pnl > 0).length;
  const tradeLosses = trades.filter((t) => t.pnl < 0).length;
  const tradeWinRate = trades.length > 0 ? (tradeWins / trades.length) * 100 : 0;

  // Position stats
  const closedPositions = positions.filter((p) => p.isClosed);
  const openPositions = positions.filter((p) => !p.isClosed);
  const posWins = closedPositions.filter((p) => p.isWin).length;
  const posLosses = closedPositions.filter((p) => !p.isWin).length;
  const posWinRate = closedPositions.length > 0 ? (posWins / closedPositions.length) * 100 : 0;
  const totalPosPnl = closedPositions.reduce((s, p) => s + p.totalPnl, 0);
  const avgWinPnl = posWins > 0 ? closedPositions.filter((p) => p.isWin).reduce((s, p) => s + p.totalPnl, 0) / posWins : 0;
  const avgLossPnl = posLosses > 0 ? closedPositions.filter((p) => !p.isWin).reduce((s, p) => s + p.totalPnl, 0) / posLosses : 0;

  // Eval stats from last 100 vs total
  const recentSignals = evaluations.filter((e) => e.result !== "rejected").length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <StatusDot status={session.status === "running" ? "running" : "stopped"} />
          <h1 className="font-mono text-xl font-semibold text-zinc-100">{session.symbol}</h1>
          <Badge variant={session.simulation ? "warning" : "muted"}>{session.simulation ? "SIMULATION" : "REAL"}</Badge>
          <span className="text-xs text-zinc-500">{session.leverage}x leverage</span>
        </div>
      </div>

      {/* ── Overview Stats ── */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Card><Stat label="Balance" value={fmtUsd(session.currentBalance)} sub={`Started ${fmtUsd(session.startingBalance)}`} /></Card>
        <Card><Stat label="P&L" value={fmtUsd(pnl)} trend={pnl >= 0 ? "up" : "down"} sub={fmtPct(pnlPct)} /></Card>
        <Card><Stat label="Open Positions" value={String(openPositions.length)} /></Card>
        <Card><Stat label="Closed Positions" value={String(closedPositions.length)} /></Card>
      </div>

      {/* ── Win Rate: Trades vs Positions ── */}
      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardTitle className="mb-3">Trade Stats</CardTitle>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <p className="text-[10px] uppercase tracking-wide text-zinc-600">Win Rate</p>
              <p className="mt-0.5 text-lg font-semibold text-zinc-100">{tradeWinRate.toFixed(0)}%</p>
            </div>
            <div>
              <p className="text-[10px] uppercase tracking-wide text-zinc-600">Wins / Losses</p>
              <p className="mt-0.5 text-lg font-semibold text-zinc-100">
                <span className="text-emerald-400">{tradeWins}</span>
                <span className="text-zinc-600 mx-1">/</span>
                <span className="text-red-400">{tradeLosses}</span>
              </p>
            </div>
            <div>
              <p className="text-[10px] uppercase tracking-wide text-zinc-600">Total Trades</p>
              <p className="mt-0.5 text-lg font-semibold text-zinc-100">{trades.length}</p>
            </div>
          </div>
          {/* Win rate bar */}
          <div className="mt-3 h-2 w-full rounded-full bg-surface-3 overflow-hidden">
            <div className="h-full rounded-full bg-emerald-500" style={{ width: `${tradeWinRate}%` }} />
          </div>
        </Card>

        <Card>
          <CardTitle className="mb-3">Position Stats</CardTitle>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <p className="text-[10px] uppercase tracking-wide text-zinc-600">Win Rate</p>
              <p className="mt-0.5 text-lg font-semibold text-zinc-100">{posWinRate.toFixed(0)}%</p>
            </div>
            <div>
              <p className="text-[10px] uppercase tracking-wide text-zinc-600">Wins / Losses</p>
              <p className="mt-0.5 text-lg font-semibold text-zinc-100">
                <span className="text-emerald-400">{posWins}</span>
                <span className="text-zinc-600 mx-1">/</span>
                <span className="text-red-400">{posLosses}</span>
              </p>
            </div>
            <div>
              <p className="text-[10px] uppercase tracking-wide text-zinc-600">Avg Win / Loss</p>
              <p className="mt-0.5 text-sm">
                <span className="font-mono text-emerald-400">{fmtUsd(avgWinPnl)}</span>
                <span className="text-zinc-600 mx-1">/</span>
                <span className="font-mono text-red-400">{fmtUsd(avgLossPnl)}</span>
              </p>
            </div>
          </div>
          <div className="mt-3 h-2 w-full rounded-full bg-surface-3 overflow-hidden">
            <div className="h-full rounded-full bg-emerald-500" style={{ width: `${posWinRate}%` }} />
          </div>
        </Card>
      </div>

      {/* ── Signal Stats: total + recent ── */}
      <Card>
        <CardTitle className="mb-3">Signal Evaluation Stats</CardTitle>
        <div className="grid grid-cols-2 gap-6 lg:grid-cols-5">
          <div>
            <p className="text-[10px] uppercase tracking-wide text-zinc-600">Total Candles</p>
            <p className="mt-0.5 text-xl font-semibold text-zinc-100">{evalStats.total}</p>
          </div>
          <div>
            <p className="text-[10px] uppercase tracking-wide text-zinc-600">Signals (all time)</p>
            <p className="mt-0.5 text-xl font-semibold text-emerald-400">{evalStats.signals}</p>
            <p className="text-[10px] text-zinc-600">
              {evalStats.total > 0 ? ((evalStats.signals / evalStats.total) * 100).toFixed(1) : 0}% signal rate
            </p>
          </div>
          <div>
            <p className="text-[10px] uppercase tracking-wide text-zinc-600">Long / Short</p>
            <p className="mt-0.5 text-lg font-semibold">
              <span className="text-emerald-400">{evalStats.longSignals}</span>
              <span className="text-zinc-600 mx-1">/</span>
              <span className="text-red-400">{evalStats.shortSignals}</span>
            </p>
          </div>
          <div>
            <p className="text-[10px] uppercase tracking-wide text-zinc-600">Rejected</p>
            <p className="mt-0.5 text-xl font-semibold text-zinc-500">{evalStats.rejected}</p>
          </div>
          <div>
            <p className="text-[10px] uppercase tracking-wide text-zinc-600">Last 100 candles</p>
            <p className="mt-0.5 text-xl font-semibold text-accent">{recentSignals}</p>
            <p className="text-[10px] text-zinc-600">{recentSignals} signals / {evaluations.length} candles</p>
          </div>
        </div>
      </Card>

      {/* ── Open positions ── */}
      {openPositions.length > 0 && (
        <Card>
          <CardHeader><CardTitle>Open Positions</CardTitle></CardHeader>
          <PositionTable positions={openPositions} showPnl={false} />
        </Card>
      )}

      {/* ── Closed positions with P&L ── */}
      {closedPositions.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Closed Positions</CardTitle>
            <span className={`font-mono text-sm font-semibold ${pnlColor(totalPosPnl)}`}>{fmtUsd(totalPosPnl)} total</span>
          </CardHeader>
          <PositionTable positions={closedPositions} showPnl={true} />
        </Card>
      )}

      {/* ── Signal Evaluations with filter ── */}
      <Card>
        <CardHeader>
          <CardTitle>Signal Evaluations — Candle by Candle</CardTitle>
        </CardHeader>
        <EvaluationTimeline evaluations={evaluations} sessionId={sessionId} />
      </Card>

      {/* Trade history */}
      {trades.length > 0 && (
        <Card>
          <CardHeader><CardTitle>Trade History</CardTitle></CardHeader>
          <Table>
            <thead>
              <tr><Th>Time</Th><Th>Side</Th><Th>Entry</Th><Th>Exit</Th><Th>Qty</Th><Th>P&L</Th><Th>Fees</Th><Th>Reason</Th></tr>
            </thead>
            <tbody>
              {trades.map((t) => (
                <tr key={t.id} className="border-t border-border-subtle">
                  <Td className="text-xs text-zinc-500 whitespace-nowrap">{t.closeTime ? fmtDate(t.closeTime) : "—"}</Td>
                  <Td><span className={`font-mono text-xs font-bold uppercase ${sideColor(t.side)}`}>{t.side}</span></Td>
                  <Td className="font-mono">{fmt(t.entryPrice, 2)}</Td>
                  <Td className="font-mono">{fmt(t.exitPrice, 2)}</Td>
                  <Td className="font-mono text-xs">{fmt(t.qty, 6)}</Td>
                  <Td className={`font-mono font-medium ${pnlColor(t.pnl)}`}>{fmtUsd(t.pnl)}</Td>
                  <Td className="font-mono text-xs text-zinc-500">{fmtUsd(t.fees)}</Td>
                  <Td>
                    <Badge variant={t.reason?.includes("stop") ? "danger" : t.reason?.includes("trailing") ? "warning" : "success"}>
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
