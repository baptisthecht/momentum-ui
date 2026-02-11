import { getStrategy } from "@/lib/api";
import { Card, CardHeader, CardTitle, Badge, EmptyState } from "@/components/ui/shared";
import { fmt } from "@/lib/utils";
import type { Strategy } from "@/types/api";

interface Props { params: Promise<{ id: string }> }

export default async function StrategyDetailPage({ params }: Props) {
  const { id } = await params;
  let strategy: Strategy | null = null;
  try { strategy = await getStrategy(id); } catch {}

  if (!strategy) return <EmptyState icon="⚙" title="Strategy not found" description="" />;

  const s = strategy;

  const sections = [
    {
      title: "RSI Configuration", rows: [
        ["Period", s.rsiPeriod], ["Oversold", s.rsiOversold], ["Overbought", s.rsiOverbought],
        ["Enable Long", s.enableRsiLong ? "Yes" : "No"], ["Enable Short", s.enableRsiShort ? "Yes" : "No"],
        ["Require Rebound", s.requireRsiRebound ? "Yes" : "No"],
      ],
    },
    {
      title: "EMA Configuration", rows: [
        ["Fast Period", s.emaFastPeriod], ["Slow Period", s.emaSlowPeriod],
        ["Touch Tolerance %", fmt(s.emaTouchTolerancePct, 2)], ["Price Extension %", fmt(s.priceExtensionPct, 2)],
        ["Require Price Cross", s.requirePriceCross ? "Yes" : "No"], ["Require Primary Trend", s.requirePrimaryTrend ? "Yes" : "No"],
        ["Price Zone Long", s.requirePriceZoneLong ? "Yes" : "No"], ["Price Zone Short", s.requirePriceZoneShort ? "Yes" : "No"],
      ],
    },
    {
      title: "ATR / Risk", rows: [
        ["ATR Period", s.atrPeriod], ["SL Multiplier", fmt(s.atrSlMult, 2)], ["TP Multiplier", fmt(s.atrTpMult, 2)],
        ["TP1 R-Multiple", fmt(s.tp1RMultiple, 2)], ["TP2 R-Multiple", fmt(s.tp2RMultiple, 2)], ["TP1 Ratio", fmt(s.tp1Ratio, 2)],
        ["Trailing", s.trailingEnabled ? "Yes" : "No"], ["Trailing ATR×", fmt(s.trailingAtrMult, 2)],
      ],
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <h1 className="text-xl font-semibold text-zinc-100">{s.name}</h1>
        {s.isDefault && <Badge variant="default">Default</Badge>}
      </div>
      {s.description && <p className="text-sm text-zinc-500">{s.description}</p>}

      <div className="grid gap-4 lg:grid-cols-3">
        {sections.map((sec) => (
          <Card key={sec.title}>
            <CardTitle className="mb-3">{sec.title}</CardTitle>
            <div className="space-y-2">
              {sec.rows.map(([label, value]) => (
                <div key={String(label)} className="flex items-center justify-between">
                  <span className="text-xs text-zinc-500">{label}</span>
                  <span className="font-mono text-xs text-zinc-200">{String(value)}</span>
                </div>
              ))}
            </div>
          </Card>
        ))}
      </div>

      {/* TP Templates */}
      {s.tpTemplates && s.tpTemplates.length > 0 && (
        <Card>
          <CardTitle className="mb-3">TP Target Templates</CardTitle>
          <div className="flex gap-3">
            {s.tpTemplates.map((tp) => (
              <div key={tp.id} className="rounded-lg bg-surface-2 border border-border px-4 py-3 text-center">
                <p className="font-mono text-sm font-semibold text-emerald-400">{fmt(tp.rMultiple, 1)}R</p>
                <p className="text-xs text-zinc-500 mt-0.5">{(tp.ratio * 100).toFixed(0)}% of position</p>
                {tp.label && <p className="text-[10px] text-zinc-600 mt-0.5">{tp.label}</p>}
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Symbol overrides */}
      {s.symbolOverrides && s.symbolOverrides.length > 0 && (
        <Card>
          <CardTitle className="mb-3">Symbol Overrides</CardTitle>
          <div className="grid gap-3 lg:grid-cols-2 xl:grid-cols-3">
            {s.symbolOverrides.map((o) => (
              <div key={o.id} className="rounded-lg border border-border bg-surface-2 p-3">
                <p className="font-mono text-sm font-semibold text-zinc-200 mb-2">{o.symbol}</p>
                <div className="space-y-1 text-xs">
                  {o.rsiOversold !== null && <div className="flex justify-between"><span className="text-zinc-500">RSI OS</span><span className="font-mono text-zinc-300">{o.rsiOversold}</span></div>}
                  {o.rsiOverbought !== null && <div className="flex justify-between"><span className="text-zinc-500">RSI OB</span><span className="font-mono text-zinc-300">{o.rsiOverbought}</span></div>}
                  {o.atrSlMult !== null && <div className="flex justify-between"><span className="text-zinc-500">ATR SL×</span><span className="font-mono text-zinc-300">{fmt(o.atrSlMult, 2)}</span></div>}
                  {o.atrTpMult !== null && <div className="flex justify-between"><span className="text-zinc-500">ATR TP×</span><span className="font-mono text-zinc-300">{fmt(o.atrTpMult, 2)}</span></div>}
                  {o.emaTouchTolerancePct !== null && <div className="flex justify-between"><span className="text-zinc-500">EMA Tol %</span><span className="font-mono text-zinc-300">{fmt(o.emaTouchTolerancePct, 2)}</span></div>}
                </div>
                {o.tpTemplates && o.tpTemplates.length > 0 && (
                  <div className="mt-2 pt-2 border-t border-border-subtle">
                    <p className="text-[10px] text-zinc-600 mb-1">TP Targets</p>
                    <div className="flex gap-1.5">
                      {o.tpTemplates.map((tp) => (
                        <span key={tp.id} className="rounded bg-surface-3 px-1.5 py-0.5 font-mono text-[10px] text-emerald-400">
                          {fmt(tp.rMultiple, 1)}R → {(tp.ratio * 100).toFixed(0)}%
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}
