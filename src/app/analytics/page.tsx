import { getSessions, getTrades, getEvaluations } from "@/lib/api";
import { Card, CardHeader, CardTitle, Stat, EmptyState } from "@/components/ui/shared";
import { fmtUsd, fmtPct, fmt } from "@/lib/utils";
import type { Trade, SignalEvaluation } from "@/types/api";
import { PnlChart } from "./_components/pnl-chart";
import { RejectionBreakdown } from "./_components/rejection-breakdown";

export default async function AnalyticsPage() {
  let trades: Trade[] = [];
  let evaluations: SignalEvaluation[] = [];

  try {
    const sessions = await getSessions();
    if (sessions.length > 0) {
      const s = sessions[0];
      [trades, evaluations] = await Promise.all([getTrades(s.id, 200), getEvaluations(s.id, 200)]);
    }
  } catch {}

  const totalPnl = trades.reduce((s, t) => s + t.pnl, 0);
  const totalFees = trades.reduce((s, t) => s + t.fees, 0);
  const wins = trades.filter((t) => t.pnl > 0);
  const losses = trades.filter((t) => t.pnl < 0);
  const avgWin = wins.length > 0 ? wins.reduce((s, t) => s + t.pnl, 0) / wins.length : 0;
  const avgLoss = losses.length > 0 ? losses.reduce((s, t) => s + t.pnl, 0) / losses.length : 0;
  const profitFactor = avgLoss !== 0 ? Math.abs(avgWin / avgLoss) : 0;
  const rejected = evaluations.filter((e) => e.result === "rejected");
  const signals = evaluations.filter((e) => e.result !== "rejected");

  // Build cumulative P&L for chart
  const pnlData = trades
    .sort((a, b) => new Date(a.closeTime ?? a.createdAt).getTime() - new Date(b.closeTime ?? b.createdAt).getTime())
    .reduce<{ date: string; pnl: number }[]>((acc, t) => {
      const prev = acc.length > 0 ? acc[acc.length - 1].pnl : 0;
      acc.push({ date: t.closeTime ?? t.createdAt, pnl: prev + t.pnl });
      return acc;
    }, []);

  // Rejection reasons breakdown
  const rejectionMap = new Map<string, number>();
  for (const e of rejected) {
    for (const c of e.checks ?? []) {
      if (!c.passed) rejectionMap.set(c.conditionName, (rejectionMap.get(c.conditionName) ?? 0) + 1);
    }
  }
  const rejections = [...rejectionMap.entries()]
    .sort((a, b) => b[1] - a[1])
    .map(([name, count]) => ({ name, count }));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-zinc-100">Analytics</h1>
        <p className="mt-0.5 text-xs text-zinc-500">Performance analysis and signal intelligence</p>
      </div>

      {/* Key metrics */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-6">
        <Card><Stat label="Total P&L" value={fmtUsd(totalPnl)} trend={totalPnl >= 0 ? "up" : "down"} /></Card>
        <Card><Stat label="Total Fees" value={fmtUsd(totalFees)} /></Card>
        <Card><Stat label="Win Rate" value={`${trades.length > 0 ? ((wins.length / trades.length) * 100).toFixed(0) : 0}%`} /></Card>
        <Card><Stat label="Profit Factor" value={fmt(profitFactor, 2)} /></Card>
        <Card><Stat label="Avg Win" value={fmtUsd(avgWin)} trend="up" /></Card>
        <Card><Stat label="Avg Loss" value={fmtUsd(avgLoss)} trend="down" /></Card>
      </div>

      {/* Charts */}
      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader><CardTitle>Cumulative P&L</CardTitle></CardHeader>
          {pnlData.length > 0 ? (
            <PnlChart data={pnlData} />
          ) : (
            <EmptyState icon="◈" title="Not enough data" description="Trade history will populate this chart" />
          )}
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Rejection Reasons</CardTitle>
            <p className="text-xs text-zinc-500">{rejected.length} rejected / {signals.length} signals</p>
          </CardHeader>
          {rejections.length > 0 ? (
            <RejectionBreakdown data={rejections} total={rejected.length} />
          ) : (
            <EmptyState icon="✓" title="No rejections yet" description="Signal evaluation data will appear here" />
          )}
        </Card>
      </div>

      {/* Signal efficiency */}
      <Card>
        <CardHeader><CardTitle>Signal Efficiency</CardTitle></CardHeader>
        <div className="grid grid-cols-3 gap-4">
          <div className="rounded-lg bg-surface-2 p-4 text-center">
            <p className="text-2xl font-semibold text-zinc-100">{evaluations.length}</p>
            <p className="text-xs text-zinc-500 mt-1">Candles evaluated</p>
          </div>
          <div className="rounded-lg bg-surface-2 p-4 text-center">
            <p className="text-2xl font-semibold text-emerald-400">{signals.length}</p>
            <p className="text-xs text-zinc-500 mt-1">Signals generated</p>
          </div>
          <div className="rounded-lg bg-surface-2 p-4 text-center">
            <p className="text-2xl font-semibold text-zinc-400">
              {evaluations.length > 0 ? ((signals.length / evaluations.length) * 100).toFixed(1) : 0}%
            </p>
            <p className="text-xs text-zinc-500 mt-1">Signal rate</p>
          </div>
        </div>
      </Card>
    </div>
  );
}
