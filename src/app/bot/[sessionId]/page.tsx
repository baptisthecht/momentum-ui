import { getSession, getEvaluations, getTrades } from "@/lib/api";
import { Card, CardHeader, CardTitle, Badge, StatusDot, Stat, EmptyState, Table, Th, Td } from "@/components/ui/shared";
import { ConditionChecks, EvaluationSummary, ResultBadge } from "@/components/shared/condition-checks";
import { fmtUsd, fmtPct, fmtDate, fmtTime, fmt, pnlColor, sideColor, sideBg } from "@/lib/utils";
import type { Session, SignalEvaluation, Trade } from "@/types/api";
import { EvaluationTimeline } from "./_components/eval-timeline";

interface Props { params: Promise<{ sessionId: string }> }

export default async function SessionDetailPage({ params }: Props) {
  const { sessionId } = await params;

  let session: Session | null = null;
  let evaluations: SignalEvaluation[] = [];
  let trades: Trade[] = [];

  try {
    [session, evaluations, trades] = await Promise.all([
      getSession(sessionId),
      getEvaluations(sessionId, 100),
      getTrades(sessionId, 50),
    ]);
  } catch {}

  if (!session) {
    return <EmptyState icon="?" title="Session not found" description="This session may not exist or you lack access." />;
  }

  const pnl = session.currentBalance - session.startingBalance;
  const pnlPct = (pnl / session.startingBalance) * 100;
  const wins = trades.filter((t) => t.pnl > 0).length;
  const losses = trades.filter((t) => t.pnl < 0).length;
  const signalCount = evaluations.filter((e) => e.result !== "rejected").length;
  const openPositions = session.positions?.filter((p) => !p.isClosed) ?? [];

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

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-5">
        <Card><Stat label="Balance" value={fmtUsd(session.currentBalance)} /></Card>
        <Card><Stat label="P&L" value={fmtUsd(pnl)} trend={pnl >= 0 ? "up" : "down"} sub={fmtPct(pnlPct)} /></Card>
        <Card><Stat label="Win / Loss" value={`${wins} / ${losses}`} sub={trades.length > 0 ? `${((wins / trades.length) * 100).toFixed(0)}% win rate` : undefined} /></Card>
        <Card><Stat label="Signals" value={String(signalCount)} sub={`of ${evaluations.length} candles`} /></Card>
        <Card><Stat label="Open Positions" value={String(openPositions.length)} /></Card>
      </div>

      {/* Open positions */}
      {openPositions.length > 0 && (
        <Card>
          <CardHeader><CardTitle>Open Positions</CardTitle></CardHeader>
          <Table>
            <thead>
              <tr><Th>Side</Th><Th>Entry</Th><Th>Qty</Th><Th>SL</Th><Th>TP</Th><Th>Trailing</Th><Th>Risk</Th></tr>
            </thead>
            <tbody>
              {openPositions.map((p) => (
                <tr key={p.id} className="border-t border-border-subtle">
                  <Td><span className={`font-mono text-xs font-bold uppercase ${sideColor(p.side)}`}>{p.side}</span></Td>
                  <Td className="font-mono">{fmt(p.entryPrice, 2)}</Td>
                  <Td className="font-mono">{fmt(p.qty, 6)}</Td>
                  <Td className="font-mono text-red-400">{fmt(p.sl, 2)}</Td>
                  <Td className="font-mono text-emerald-400">{fmt(p.tp, 2)}</Td>
                  <Td>{p.trailingActive ? <Badge variant="success">Active</Badge> : <span className="text-zinc-600">—</span>}</Td>
                  <Td className="font-mono text-xs">{fmtUsd(p.riskAmount)}</Td>
                </tr>
              ))}
            </tbody>
          </Table>
        </Card>
      )}

      {/* Signal evaluations — the core feature */}
      <Card>
        <CardHeader>
          <CardTitle>Signal Evaluations — Candle by Candle</CardTitle>
          <p className="text-xs text-zinc-500">{evaluations.length} evaluations</p>
        </CardHeader>
        <EvaluationTimeline evaluations={evaluations} />
      </Card>

      {/* Trade history */}
      {trades.length > 0 && (
        <Card>
          <CardHeader><CardTitle>Trade History</CardTitle></CardHeader>
          <Table>
            <thead>
              <tr><Th>Time</Th><Th>Side</Th><Th>Entry</Th><Th>Exit</Th><Th>P&L</Th><Th>Fees</Th><Th>Reason</Th></tr>
            </thead>
            <tbody>
              {trades.map((t) => (
                <tr key={t.id} className="border-t border-border-subtle">
                  <Td className="text-xs text-zinc-500">{t.closeTime ? fmtDate(t.closeTime) : "—"}</Td>
                  <Td><span className={`font-mono text-xs font-bold uppercase ${sideColor(t.side)}`}>{t.side}</span></Td>
                  <Td className="font-mono">{fmt(t.entryPrice, 2)}</Td>
                  <Td className="font-mono">{fmt(t.exitPrice, 2)}</Td>
                  <Td className={`font-mono font-medium ${pnlColor(t.pnl)}`}>{fmtUsd(t.pnl)}</Td>
                  <Td className="font-mono text-xs text-zinc-500">{fmtUsd(t.fees)}</Td>
                  <Td><Badge variant={t.reason?.includes("stop") ? "danger" : t.reason?.includes("trailing") ? "warning" : "success"}>{t.reason ?? "close"}</Badge></Td>
                </tr>
              ))}
            </tbody>
          </Table>
        </Card>
      )}
    </div>
  );
}
