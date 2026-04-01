"use client";
import { useState, useEffect } from "react";
import { Card, Badge, EmptyState } from "@/components/ui/shared";
import { fmt, fmtDate } from "@/lib/utils";
import { useRouter } from "next/navigation";
import Link from "next/link";

interface Strategy {
  id: string; name: string; description: string | null; isDefault: boolean;
  rsiPeriod: number; rsiOversold: number; rsiOverbought: number;
  emaFastPeriod: number; emaSlowPeriod: number; atrSlMult: number; atrTpMult: number;
  symbolOverrides: { id: string; symbol: string }[];
  tpTemplates: { id: string; rMultiple: number; ratio: number; label: string | null }[];
  createdAt: string;
}

export default function StrategiesPage() {
  const router = useRouter();
  const [strategies, setStrategies] = useState<Strategy[]>([]);
  const [loading, setLoading] = useState(true);
  const [duplicating, setDuplicating] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    try {
      const res = await fetch("/api/proxy/strategies");
      if (res.ok) setStrategies(await res.json());
    } finally { setLoading(false); }
  }

  useEffect(() => { load(); }, []);

  async function duplicate(id: string) {
    setDuplicating(id);
    const res = await fetch(`/api/proxy/strategies/${id}/duplicate`, { method: "POST" });
    if (res.ok) { await load(); }
    setDuplicating(null);
  }

  async function remove(id: string) {
    if (!confirm("Supprimer cette stratégie ? Les sessions actives continueront avec leur configuration.")) return;
    setDeleting(id);
    await fetch(`/api/proxy/strategies/${id}`, { method: "DELETE" });
    await load();
    setDeleting(null);
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-zinc-100">Stratégies</h1>
          <p className="mt-0.5 text-xs text-zinc-500">Gestion des configurations de trading</p>
        </div>
        <Link href="/strategies/new"
          className="flex items-center gap-2 rounded-lg bg-accent px-4 py-2 text-sm font-medium text-white transition hover:bg-accent-hover">
          + Nouvelle stratégie
        </Link>
      </div>

      {loading ? (
        <div className="grid gap-4 lg:grid-cols-2">{[1,2].map(i => <div key={i} className="h-48 rounded-xl bg-surface-1 animate-pulse" />)}</div>
      ) : strategies.length === 0 ? (
        <Card><EmptyState icon="⚙" title="Aucune stratégie" description="La stratégie par défaut est créée au premier démarrage du bot." /></Card>
      ) : (
        <div className="grid gap-4 lg:grid-cols-2">
          {strategies.map(s => (
            <div key={s.id} className="group relative">
              <Link href={`/strategies/${s.id}`}>
                <Card className="transition hover:border-accent/30 cursor-pointer">
                  {/* Header */}
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="text-sm font-semibold text-zinc-200">{s.name}</h3>
                        {s.isDefault && <Badge variant="default">Défaut</Badge>}
                      </div>
                      {s.description && <p className="text-xs text-zinc-500 mt-0.5">{s.description}</p>}
                    </div>
                  </div>

                  {/* Key params */}
                  <div className="grid grid-cols-3 gap-2 mb-4">
                    {[
                      { label: "RSI", value: `${s.rsiOversold}/${s.rsiOverbought}`, tip: "Survente/Surachat" },
                      { label: "EMA", value: `${s.emaFastPeriod}/${s.emaSlowPeriod}`, tip: "Rapide/Lente" },
                      { label: "SL×", value: fmt(s.atrSlMult, 1), tip: "Multiplicateur ATR SL" },
                      { label: "TP×", value: fmt(s.atrTpMult, 1), tip: "Multiplicateur ATR TP" },
                      { label: "TP paliers", value: String(s.tpTemplates?.length ?? 0), tip: "Nombre d'objectifs" },
                      { label: "Overrides", value: String(s.symbolOverrides?.length ?? 0), tip: "Symboles personnalisés" },
                    ].map(p => (
                      <div key={p.label} className="rounded-lg bg-surface-2 px-2.5 py-2" title={p.tip}>
                        <p className="text-[9px] uppercase tracking-wide text-zinc-600">{p.label}</p>
                        <p className="font-mono text-xs text-zinc-200 mt-0.5">{p.value}</p>
                      </div>
                    ))}
                  </div>

                  {/* TP visual */}
                  {s.tpTemplates && s.tpTemplates.length > 0 && (
                    <div className="mb-3">
                      <div className="flex gap-1 h-5">
                        {s.tpTemplates.sort((a, b) => a.rMultiple - b.rMultiple).map((t, i) => (
                          <div key={t.id}
                            style={{ width: `${t.ratio * 100}%` }}
                            className={["bg-emerald-600", "bg-emerald-500", "bg-emerald-400", "bg-teal-400"][i] + " rounded flex items-center justify-center text-[9px] text-white font-mono"}>
                            {t.label ?? `TP${i+1}`} {fmt(t.rMultiple,1)}R
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Symbol overrides */}
                  {s.symbolOverrides && s.symbolOverrides.length > 0 && (
                    <div className="flex items-center gap-1.5 pt-2.5 border-t border-border-subtle">
                      <span className="text-[10px] text-zinc-600 mr-1">Overrides :</span>
                      {s.symbolOverrides.map(o => (
                        <span key={o.id} className="rounded bg-surface-3 px-1.5 py-0.5 font-mono text-[10px] text-zinc-400">{o.symbol}</span>
                      ))}
                    </div>
                  )}
                </Card>
              </Link>

              {/* Action buttons on hover */}
              <div className="absolute top-4 right-4 flex gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity z-10">
                <Link href={`/strategies/${s.id}/edit`}
                  className="rounded-md border border-border bg-surface-1 px-2.5 py-1 text-xs text-zinc-400 hover:text-zinc-200 transition"
                  onClick={e => e.stopPropagation()}>
                  Éditer
                </Link>
                <button onClick={e => { e.preventDefault(); duplicate(s.id); }} disabled={duplicating === s.id}
                  className="rounded-md border border-border bg-surface-1 px-2.5 py-1 text-xs text-zinc-400 hover:text-zinc-200 transition disabled:opacity-40">
                  {duplicating === s.id ? "…" : "Dupliquer"}
                </button>
                {!s.isDefault && (
                  <button onClick={e => { e.preventDefault(); remove(s.id); }} disabled={deleting === s.id}
                    className="rounded-md border border-red-500/20 bg-surface-1 px-2.5 py-1 text-xs text-red-400 hover:bg-red-500/10 transition disabled:opacity-40">
                    {deleting === s.id ? "…" : "Supprimer"}
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
