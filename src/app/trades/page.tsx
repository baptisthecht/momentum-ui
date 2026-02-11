import { getSessions, getTrades } from "@/lib/api";
import { Card, CardHeader, CardTitle, Badge, Table, Th, Td, EmptyState } from "@/components/ui/shared";
import { fmtUsd, fmtPct, fmtDate, fmt, pnlColor, sideColor } from "@/lib/utils";
import type { Trade } from "@/types/api";

export default async function TradesPage() {
  let allTrades: Trade[] = [];
  try {
    const sessions = await getSessions();
    const results = await Promise.all(sessions.slice(0, 5).map((s) => getTrades(s.id, 50).catch(() => [])));
    allTrades = results.flat().sort((a, b) => new Date(b.closeTime ?? b.createdAt).getTime() - new Date(a.closeTime ?? a.createdAt).getTime());
  } catch {}

  const totalPnl = allTrades.reduce((s, t) => s + t.pnl, 0);
  const totalFees = allTrades.reduce((s, t) => s + t.fees, 0);
  const wins = allTrades.filter((t) => t.pnl > 0).length;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-zinc-100">Trades</h1>
        <p className="mt-0.5 text-xs text-zinc-500">{allTrades.length} trades across all sessions</p>
      </div>

      {/* Summary */}
      <div className="flex items-center gap-6">
        <div className="rounded-lg bg-surface-1 border border-border px-4 py-2.5">
          <span className="text-xs text-zinc-500 mr-2">Total P&L</span>
          <span className={`font-mono text-sm font-semibold ${pnlColor(totalPnl)}`}>{fmtUsd(totalPnl)}</span>
        </div>
        <div className="rounded-lg bg-surface-1 border border-border px-4 py-2.5">
          <span className="text-xs text-zinc-500 mr-2">Fees</span>
          <span className="font-mono text-sm text-zinc-300">{fmtUsd(totalFees)}</span>
        </div>
        <div className="rounded-lg bg-surface-1 border border-border px-4 py-2.5">
          <span className="text-xs text-zinc-500 mr-2">Win Rate</span>
          <span className="font-mono text-sm text-zinc-300">{allTrades.length > 0 ? ((wins / allTrades.length) * 100).toFixed(0) : 0}%</span>
        </div>
      </div>

      {/* Table */}
      <Card>
        {allTrades.length === 0 ? (
          <EmptyState icon="⇄" title="No trades recorded" description="Start a session and the bot will trade automatically" />
        ) : (
          <Table>
            <thead>
              <tr>
                <Th>Close Time</Th><Th>Symbol</Th><Th>Side</Th><Th>Entry</Th><Th>Exit</Th>
                <Th>Qty</Th><Th>P&L</Th><Th>%</Th><Th>Fees</Th><Th>Reason</Th>
              </tr>
            </thead>
            <tbody>
              {allTrades.map((t) => (
                <tr key={t.id} className="border-t border-border-subtle transition hover:bg-surface-2">
                  <Td className="text-xs text-zinc-500 whitespace-nowrap">{t.closeTime ? fmtDate(t.closeTime) : "—"}</Td>
                  <Td className="font-mono font-medium text-zinc-200">{t.symbol}</Td>
                  <Td><span className={`font-mono text-xs font-bold uppercase ${sideColor(t.side)}`}>{t.side}</span></Td>
                  <Td className="font-mono">{fmt(t.entryPrice, 2)}</Td>
                  <Td className="font-mono">{fmt(t.exitPrice, 2)}</Td>
                  <Td className="font-mono text-xs">{fmt(t.qty, 6)}</Td>
                  <Td className={`font-mono font-medium ${pnlColor(t.pnl)}`}>{fmtUsd(t.pnl)}</Td>
                  <Td className={`font-mono text-xs ${pnlColor(t.pnlPct)}`}>{fmtPct(t.pnlPct)}</Td>
                  <Td className="font-mono text-xs text-zinc-600">{fmtUsd(t.fees)}</Td>
                  <Td>
                    <Badge variant={t.reason?.includes("stop") ? "danger" : t.reason?.includes("trailing") ? "warning" : "success"}>
                      {t.reason ?? "close"}
                    </Badge>
                  </Td>
                </tr>
              ))}
            </tbody>
          </Table>
        )}
      </Card>
    </div>
  );
}
