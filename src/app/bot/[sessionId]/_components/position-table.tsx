import { Table, Th, Td, Badge } from "@/components/ui/shared";
import { fmtUsd, fmt, fmtDate, pnlColor, sideColor } from "@/lib/utils";

interface PositionRow {
  id: string; symbol: string; side: string; entryPrice: number; sl: number; tp: number;
  leverage: number; originalQty: number; qty: number; isClosed: boolean;
  openTime: string; trailingActive: boolean; bestPrice: number; riskAmount: number;
  totalPnl: number; totalFees: number; netPnl: number; tradeCount: number; isWin: boolean;
  tpTargets: { sortOrder: number; price: number; ratio: number; targetQty: number; filledQty: number; hit: boolean; label: string | null }[];
  trades: { reason: string; pnl: number; qty: number; isPartial: boolean }[];
}

export function PositionTable({ positions, showPnl }: { positions: PositionRow[]; showPnl: boolean }) {
  return (
    <Table>
      <thead>
        <tr>
          <Th>Side</Th><Th>Entry</Th><Th>SL</Th><Th>TP</Th><Th>Qty</Th><Th>Leverage</Th>
          <Th>TP Progress</Th><Th>Opened</Th>
          {showPnl && <><Th>P&L</Th><Th>Fees</Th><Th>Result</Th></>}
        </tr>
      </thead>
      <tbody>
        {positions.map((p) => (
          <tr key={p.id} className="border-t border-border-subtle">
            <Td>
              <span className={`font-mono text-xs font-bold uppercase ${sideColor(p.side)}`}>{p.side}</span>
            </Td>
            <Td className="font-mono">{fmt(p.entryPrice, 2)}</Td>
            <Td className="font-mono text-red-400">{fmt(p.sl, 2)}</Td>
            <Td className="font-mono text-emerald-400">{fmt(p.tp, 2)}</Td>
            <Td className="font-mono text-xs">{fmt(p.originalQty, 6)}</Td>
            <Td className="font-mono">{p.leverage}x</Td>
            <Td>
              <TpProgress targets={p.tpTargets} />
            </Td>
            <Td className="text-xs text-zinc-500 whitespace-nowrap">{fmtDate(p.openTime)}</Td>
            {showPnl && (
              <>
                <Td className={`font-mono font-semibold ${pnlColor(p.totalPnl)}`}>{fmtUsd(p.totalPnl)}</Td>
                <Td className="font-mono text-xs text-zinc-500">{fmtUsd(p.totalFees)}</Td>
                <Td>
                  <Badge variant={p.isWin ? "success" : "danger"}>
                    {p.isWin ? "WIN" : "LOSS"}
                  </Badge>
                </Td>
              </>
            )}
          </tr>
        ))}
      </tbody>
    </Table>
  );
}

function TpProgress({ targets }: { targets: PositionRow["tpTargets"] }) {
  if (!targets || targets.length === 0) return <span className="text-zinc-600">—</span>;

  return (
    <div className="flex items-center gap-1">
      {targets.sort((a, b) => a.sortOrder - b.sortOrder).map((t) => (
        <div
          key={t.sortOrder}
          className={`flex items-center gap-1 rounded px-1.5 py-0.5 text-[10px] font-mono border ${
            t.hit
              ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
              : "bg-surface-3 text-zinc-500 border-border"
          }`}
          title={`${t.label ?? `TP${t.sortOrder + 1}`}: ${fmt(t.price, 2)} (${(t.ratio * 100).toFixed(0)}%)`}
        >
          {t.hit ? "✓" : "—"} {t.label ?? `TP${t.sortOrder + 1}`}
        </div>
      ))}
    </div>
  );
}
