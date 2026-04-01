import { getStrategy } from "@/lib/api";
import { Card, CardHeader, CardTitle, Badge, EmptyState } from "@/components/ui/shared";
import { fmt } from "@/lib/utils";
import Link from "next/link";

interface Props { params: Promise<{ id: string }> }

const PARAM_INFO: Record<string, { label: string; icon: string; help: string }> = {
  rsiPeriod: { icon: "📊", label: "Période RSI", help: "Nombre de bougies pour le calcul du RSI" },
  rsiOversold: { icon: "⬇", label: "Seuil survente", help: "RSI en dessous = signal LONG possible" },
  rsiOverbought: { icon: "⬆", label: "Seuil surachat", help: "RSI au dessus = signal SHORT possible" },
  emaFastPeriod: { icon: "➡", label: "EMA rapide", help: "Tendance court terme" },
  emaSlowPeriod: { icon: "➡", label: "EMA lente", help: "Tendance principale" },
  emaTouchTolerancePct: { icon: "🎯", label: "Tolérance EMA", help: "Zone de contact en %" },
  atrSlMult: { icon: "🛑", label: "SL multiplier", help: "ATR × mult = distance SL" },
  atrTpMult: { icon: "✅", label: "TP multiplier", help: "ATR × mult = distance TP" },
  trailingAtrMult: { icon: "🔄", label: "Trailing mult", help: "Distance du trailing stop" },
};

export default async function StrategyDetailPage({ params }: Props) {
  const { id } = await params;
  let strategy: any = null;
  try { strategy = await getStrategy(id); } catch {}
  if (!strategy) return <EmptyState icon="⚙" title="Stratégie introuvable" description="" />;
  const s = strategy;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h1 className="text-xl font-semibold text-zinc-100">{s.name}</h1>
          {s.isDefault && <Badge variant="default">Défaut</Badge>}
        </div>
        <div className="flex gap-2">
          <Link href={`/strategies/${id}/edit`}
            className="rounded-lg border border-border px-4 py-2 text-sm text-zinc-400 transition hover:text-zinc-200">
            Éditer
          </Link>
          <Link href="/strategies"
            className="rounded-lg text-xs text-zinc-600 hover:text-zinc-400 px-2 py-2 transition">
            ← Retour
          </Link>
        </div>
      </div>
      {s.description && <p className="text-sm text-zinc-500">{s.description}</p>}

      {/* TP Templates visual */}
      {s.tpTemplates?.length > 0 && (
        <Card>
          <CardTitle className="mb-4">🎯 Objectifs de Take Profit</CardTitle>
          <div className="flex gap-1 h-8 mb-4">
            {s.tpTemplates.sort((a: any, b: any) => a.sortOrder - b.sortOrder).map((t: any, i: number) => (
              <div key={t.id} style={{ width: `${t.ratio * 100}%` }}
                className={["bg-emerald-600", "bg-emerald-500", "bg-emerald-400", "bg-teal-400"][i] + " rounded flex items-center justify-center text-xs text-white font-mono font-medium"}>
                {t.label ?? `TP${i+1}`} · {fmt(t.rMultiple, 1)}R
              </div>
            ))}
          </div>
          <div className="grid grid-cols-3 gap-3">
            {s.tpTemplates.map((t: any, i: number) => (
              <div key={t.id} className="rounded-lg bg-surface-2 border border-border px-4 py-3">
                <div className="flex items-center gap-2 mb-1">
                  <span className={["bg-emerald-600","bg-emerald-500","bg-emerald-400","bg-teal-400"][i] + " h-2 w-2 rounded-full"} />
                  <span className="text-xs font-medium text-zinc-300">{t.label ?? `TP${i+1}`}</span>
                </div>
                <p className="font-mono text-lg font-semibold text-emerald-400">{fmt(t.rMultiple, 1)}R</p>
                <p className="text-xs text-zinc-500">{(t.ratio * 100).toFixed(0)}% de la position</p>
                <p className="text-[10px] text-zinc-600 mt-1">= {fmt(t.rMultiple, 1)}× la distance du SL</p>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Params grid */}
      <div className="grid gap-4 lg:grid-cols-3">
        {/* RSI */}
        <Card>
          <CardTitle className="mb-4 flex items-center gap-2">📊 RSI</CardTitle>
          <div className="space-y-3">
            {[
              { label: "Période", value: s.rsiPeriod, help: "Bougies de calcul" },
              { label: "Seuil survente (LONG)", value: s.rsiOversold, color: "text-emerald-400", help: "RSI < seuil = opportunité longue" },
              { label: "Seuil surachat (SHORT)", value: s.rsiOverbought, color: "text-red-400", help: "RSI > seuil = opportunité courte" },
              { label: "RSI activé LONG", value: s.enableRsiLong ? "Oui" : "Non" },
              { label: "RSI activé SHORT", value: s.enableRsiShort ? "Oui" : "Non" },
              { label: "Rebond RSI requis", value: s.requireRsiRebound ? "Oui" : "Non" },
            ].map(r => (
              <div key={r.label} className="flex items-center justify-between" title={r.help}>
                <span className="text-xs text-zinc-500">{r.label}</span>
                <span className={`font-mono text-xs ${r.color ?? "text-zinc-200"}`}>{r.value}</span>
              </div>
            ))}
          </div>
        </Card>

        {/* EMA */}
        <Card>
          <CardTitle className="mb-4 flex items-center gap-2">📈 EMA & Tendance</CardTitle>
          <div className="space-y-3">
            {[
              { label: "EMA rapide", value: s.emaFastPeriod, help: "Tendance court terme" },
              { label: "EMA lente", value: s.emaSlowPeriod, help: "Tendance principale" },
              { label: "Tolérance contact", value: `${fmt(s.emaTouchTolerancePct, 2)}%` },
              { label: "Extension prix", value: `${fmt(s.priceExtensionPct, 2)}%` },
              { label: "Croisement requis", value: s.requirePriceCross ? "Oui" : "Non" },
              { label: "Tendance primaire", value: s.requirePrimaryTrend ? "Oui" : "Non" },
              { label: "Zone EMA LONG", value: s.requirePriceZoneLong ? "Oui" : "Non" },
              { label: "Confirmation HTF", value: s.requireTrendConfirmation ? `×${s.trendTfMultiplier} (EMA${s.trendTfEmaPeriod})` : "Non" },
            ].map(r => (
              <div key={r.label} className="flex items-center justify-between" title={r.help ?? ""}>
                <span className="text-xs text-zinc-500">{r.label}</span>
                <span className="font-mono text-xs text-zinc-200">{r.value}</span>
              </div>
            ))}
          </div>
        </Card>

        {/* ATR */}
        <Card>
          <CardTitle className="mb-4 flex items-center gap-2">📏 ATR & Risque</CardTitle>
          <div className="space-y-3">
            {[
              { label: "Période ATR", value: s.atrPeriod },
              { label: "SL (×ATR)", value: fmt(s.atrSlMult, 2), color: "text-red-400" },
              { label: "TP (×ATR)", value: fmt(s.atrTpMult, 2), color: "text-emerald-400" },
              { label: "Trailing stop", value: s.trailingEnabled ? `×${fmt(s.trailingAtrMult, 2)} ATR` : "Désactivé" },
              { label: "Risque/trade", value: `${fmt((s.riskPerTradePct ?? 0.1) * 100, 1)}%` },
              { label: "Notionnel max", value: `$${s.maxNotionalUsdt}` },
              { label: "Profit min", value: `$${fmt(s.minProfitUsdt, 2)}` },
            ].map(r => (
              <div key={r.label} className="flex items-center justify-between">
                <span className="text-xs text-zinc-500">{r.label}</span>
                <span className={`font-mono text-xs ${r.color ?? "text-zinc-200"}`}>{r.value}</span>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* Symbol overrides */}
      {s.symbolOverrides?.length > 0 && (
        <Card>
          <CardTitle className="mb-4">🔧 Surcharges par symbole</CardTitle>
          <p className="text-xs text-zinc-500 mb-4">Ces paramètres remplacent la configuration de base pour chaque symbole spécifique.</p>
          <div className="grid gap-3 lg:grid-cols-2 xl:grid-cols-3">
            {s.symbolOverrides.map((o: any) => (
              <div key={o.id} className="rounded-xl border border-border bg-surface-2 p-4">
                <p className="font-mono text-sm font-bold text-zinc-100 mb-3">{o.symbol}</p>
                <div className="space-y-1.5">
                  {o.rsiOversold !== null && <Row label="RSI survente" value={o.rsiOversold} color="text-emerald-400" />}
                  {o.rsiOverbought !== null && <Row label="RSI surachat" value={o.rsiOverbought} color="text-red-400" />}
                  {o.emaTouchTolerancePct !== null && <Row label="Tolérance EMA" value={`${fmt(o.emaTouchTolerancePct, 2)}%`} />}
                  {o.atrSlMult !== null && <Row label="SL×ATR" value={fmt(o.atrSlMult, 2)} color="text-red-400" />}
                  {o.atrTpMult !== null && <Row label="TP×ATR" value={fmt(o.atrTpMult, 2)} color="text-emerald-400" />}
                  {o.trailingAtrMult !== null && <Row label="Trailing×ATR" value={fmt(o.trailingAtrMult, 2)} />}
                </div>
                {o.tpTemplates?.length > 0 && (
                  <div className="mt-3 pt-3 border-t border-border-subtle">
                    <p className="text-[10px] text-zinc-600 mb-2">TP personnalisés</p>
                    <div className="flex gap-1 h-5">
                      {o.tpTemplates.sort((a: any, b: any) => a.sortOrder - b.sortOrder).map((t: any, i: number) => (
                        <div key={t.id} style={{ width: `${t.ratio * 100}%` }}
                          className={["bg-emerald-600","bg-emerald-500","bg-emerald-400","bg-teal-400"][i] + " rounded flex items-center justify-center text-[9px] text-white font-mono"}>
                          {fmt(t.rMultiple,1)}R
                        </div>
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

function Row({ label, value, color }: { label: string; value: any; color?: string }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-xs text-zinc-500">{label}</span>
      <span className={`font-mono text-xs ${color ?? "text-zinc-200"}`}>{value}</span>
    </div>
  );
}
