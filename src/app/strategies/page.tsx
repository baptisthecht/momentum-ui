import { getStrategies } from "@/lib/api";
import { Card, CardHeader, CardTitle, Badge, EmptyState } from "@/components/ui/shared";
import { fmt } from "@/lib/utils";
import type { Strategy } from "@/types/api";
import Link from "next/link";

export default async function StrategiesPage() {
  let strategies: Strategy[] = [];
  try { strategies = await getStrategies(); } catch {}

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-zinc-100">Strategies</h1>
        <p className="mt-0.5 text-xs text-zinc-500">Manage trading strategy configurations</p>
      </div>

      {strategies.length === 0 ? (
        <Card><EmptyState icon="⚙" title="No strategies" description="Default strategy is seeded on first boot" /></Card>
      ) : (
        <div className="grid gap-4 lg:grid-cols-2">
          {strategies.map((s) => (
            <Link key={s.id} href={`/strategies/${s.id}`} className="group">
              <Card className="transition hover:border-accent/30">
                <div className="flex items-center gap-2 mb-4">
                  <h3 className="text-sm font-semibold text-zinc-200">{s.name}</h3>
                  {s.isDefault && <Badge variant="default">Default</Badge>}
                </div>
                {s.description && <p className="text-xs text-zinc-500 mb-4">{s.description}</p>}

                {/* Key params grid */}
                <div className="grid grid-cols-3 gap-3">
                  {[
                    { label: "RSI Period", value: s.rsiPeriod },
                    { label: "RSI OS/OB", value: `${s.rsiOversold}/${s.rsiOverbought}` },
                    { label: "EMA Fast", value: s.emaFastPeriod },
                    { label: "EMA Slow", value: s.emaSlowPeriod },
                    { label: "ATR SL×", value: fmt(s.atrSlMult, 1) },
                    { label: "ATR TP×", value: fmt(s.atrTpMult, 1) },
                  ].map((p) => (
                    <div key={p.label} className="rounded bg-surface-2 px-2.5 py-1.5">
                      <p className="text-[9px] uppercase tracking-wide text-zinc-600">{p.label}</p>
                      <p className="font-mono text-xs text-zinc-300">{p.value}</p>
                    </div>
                  ))}
                </div>

                {/* Symbol overrides */}
                {s.symbolOverrides && s.symbolOverrides.length > 0 && (
                  <div className="mt-3 flex items-center gap-1.5 pt-2.5 border-t border-border-subtle">
                    <span className="text-[10px] text-zinc-600 mr-1">Overrides:</span>
                    {s.symbolOverrides.map((o) => (
                      <span key={o.id} className="rounded bg-surface-3 px-1.5 py-0.5 font-mono text-[10px] text-zinc-400">{o.symbol}</span>
                    ))}
                  </div>
                )}

                <p className="mt-3 text-xs text-accent opacity-0 transition group-hover:opacity-100">View full config →</p>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
