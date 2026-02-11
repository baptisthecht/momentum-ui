import { getSessions, getSession } from "@/lib/api";
import { Card, CardHeader, CardTitle, Badge, Table, Th, Td, EmptyState, StatusDot } from "@/components/ui/shared";
import { fmtUsd, fmt, fmtDate, sideColor } from "@/lib/utils";
import type { Position, Session } from "@/types/api";

export default async function PositionsPage() {
  let allOpen: (Position & { sessionSymbol: string })[] = [];
  let allClosed: (Position & { sessionSymbol: string })[] = [];

  try {
    const sessions = await getSessions();
    const details = await Promise.all(sessions.slice(0, 5).map((s) => getSession(s.id).catch(() => null)));
    for (const d of details) {
      if (!d?.positions) continue;
      for (const p of d.positions) {
        const ext = { ...p, sessionSymbol: d.symbol };
        if (p.isClosed) allClosed.push(ext);
        else allOpen.push(ext);
      }
    }
  } catch {}

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-zinc-100">Positions</h1>
        <p className="mt-0.5 text-xs text-zinc-500">{allOpen.length} open · {allClosed.length} closed</p>
      </div>

      {/* Open */}
      <Card>
        <CardHeader>
          <CardTitle>Open Positions</CardTitle>
          <Badge variant="success">{allOpen.length} active</Badge>
        </CardHeader>
        {allOpen.length === 0 ? (
          <EmptyState icon="◎" title="No open positions" description="The bot will open positions when signals are generated" />
        ) : (
          <Table>
            <thead><tr><Th>Symbol</Th><Th>Side</Th><Th>Entry</Th><Th>Qty</Th><Th>SL</Th><Th>TP</Th><Th>Trailing</Th><Th>Best</Th><Th>Risk</Th><Th>Opened</Th></tr></thead>
            <tbody>
              {allOpen.map((p) => (
                <tr key={p.id} className="border-t border-border-subtle">
                  <Td className="font-mono font-medium text-zinc-200">{p.symbol}</Td>
                  <Td><span className={`font-mono text-xs font-bold uppercase ${sideColor(p.side)}`}>{p.side}</span></Td>
                  <Td className="font-mono">{fmt(p.entryPrice, 2)}</Td>
                  <Td className="font-mono text-xs">{fmt(p.qty, 6)}</Td>
                  <Td className="font-mono text-red-400">{fmt(p.sl, 2)}</Td>
                  <Td className="font-mono text-emerald-400">{fmt(p.tp, 2)}</Td>
                  <Td>{p.trailingActive ? <Badge variant="success">Active</Badge> : "—"}</Td>
                  <Td className="font-mono">{fmt(p.bestPrice, 2)}</Td>
                  <Td className="font-mono text-xs text-zinc-500">{fmtUsd(p.riskAmount)}</Td>
                  <Td className="text-xs text-zinc-500">{fmtDate(p.openTime)}</Td>
                </tr>
              ))}
            </tbody>
          </Table>
        )}
      </Card>

      {/* Recently closed */}
      {allClosed.length > 0 && (
        <Card>
          <CardHeader><CardTitle>Recently Closed</CardTitle></CardHeader>
          <Table>
            <thead><tr><Th>Symbol</Th><Th>Side</Th><Th>Entry</Th><Th>Qty</Th><Th>SL</Th><Th>TP</Th><Th>Opened</Th></tr></thead>
            <tbody>
              {allClosed.slice(0, 20).map((p) => (
                <tr key={p.id} className="border-t border-border-subtle opacity-60">
                  <Td className="font-mono text-zinc-400">{p.symbol}</Td>
                  <Td><span className={`font-mono text-xs uppercase ${sideColor(p.side)}`}>{p.side}</span></Td>
                  <Td className="font-mono">{fmt(p.entryPrice, 2)}</Td>
                  <Td className="font-mono text-xs">{fmt(p.originalQty, 6)}</Td>
                  <Td className="font-mono">{fmt(p.sl, 2)}</Td>
                  <Td className="font-mono">{fmt(p.tp, 2)}</Td>
                  <Td className="text-xs text-zinc-600">{fmtDate(p.openTime)}</Td>
                </tr>
              ))}
            </tbody>
          </Table>
        </Card>
      )}
    </div>
  );
}
