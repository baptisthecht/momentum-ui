"use client";
import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";

// ── Métadonnées des paramètres avec explications françaises ──────────────────

const PARAMS = {
  // RSI
  rsiPeriod: {
    label: "Période RSI", unit: "bougies", type: "number", min: 2, max: 50, step: 1,
    section: "rsi",
    help: "Nombre de bougies utilisées pour calculer le RSI. Une valeur de 14 est le standard. Plus la période est courte, plus le RSI est réactif mais génère plus de faux signaux.",
  },
  rsiOversold: {
    label: "Seuil survente (LONG)", unit: "", type: "number", min: 1, max: 50, step: 1,
    section: "rsi",
    help: "Quand le RSI descend sous ce seuil, le marché est considéré en survente et un signal LONG devient possible. Valeur typique: 30-35. Plus bas = signaux plus rares mais plus fiables.",
  },
  rsiOverbought: {
    label: "Seuil surachat (SHORT)", unit: "", type: "number", min: 50, max: 99, step: 1,
    section: "rsi",
    help: "Quand le RSI monte au-dessus de ce seuil, le marché est en surachat et un signal SHORT devient possible. Valeur typique: 65-70. Plus haut = signaux plus rares mais plus fiables.",
  },
  enableRsiLong: {
    label: "Activer filtre RSI pour LONG", type: "boolean", section: "rsi",
    help: "Si désactivé, le bot ne vérifie pas le RSI pour les entrées longues. Utile si tu veux uniquement filtrer par tendance EMA.",
  },
  enableRsiShort: {
    label: "Activer filtre RSI pour SHORT", type: "boolean", section: "rsi",
    help: "Si désactivé, le bot ne vérifie pas le RSI pour les entrées courtes.",
  },
  requireRsiRebound: {
    label: "RSI en rebond requis", type: "boolean", section: "rsi",
    help: "Exige que le RSI soit en train de remonter (pour LONG) ou descendre (pour SHORT) par rapport à la bougie précédente. Évite les entrées sur des RSI en continuation de tendance.",
  },
  // EMA
  emaFastPeriod: {
    label: "EMA rapide", unit: "bougies", type: "number", min: 5, max: 100, step: 1,
    section: "ema",
    help: "La moyenne mobile exponentielle rapide (souvent 50). Elle trace la tendance à court terme. Le prix doit revenir près de cette EMA pour déclencher un signal.",
  },
  emaSlowPeriod: {
    label: "EMA lente", unit: "bougies", type: "number", min: 50, max: 500, step: 5,
    section: "ema",
    help: "La moyenne mobile lente (souvent 200). Définit la tendance principale. Les LONG ne sont pris que si l'EMA rapide est au-dessus de l'EMA lente.",
  },
  emaTouchTolerancePct: {
    label: "Tolérance de contact EMA", unit: "%", type: "number", min: 0.1, max: 5, step: 0.1,
    section: "ema",
    help: "Zone autour de l'EMA rapide considérée comme 'contact'. Par exemple 0.6% signifie que le prix doit être à moins de 0.6% de l'EMA pour que la condition soit remplie.",
  },
  priceExtensionPct: {
    label: "Extension de prix max", unit: "%", type: "number", min: 0, max: 5, step: 0.05,
    section: "ema",
    help: "Permet des entrées légèrement au-delà de la zone EMA. Si 0.25%, le prix peut être jusqu'à 0.25% au-dessus de l'EMA rapide (pour LONG) et quand même déclencher un signal.",
  },
  requirePriceCross: {
    label: "Croisement de prix requis", type: "boolean", section: "ema",
    help: "Exige que le prix ait croisé l'EMA rapide entre la bougie précédente et la bougie actuelle. Confirme que l'entrée se fait sur un retour à l'EMA et non une cassure.",
  },
  requirePrimaryTrend: {
    label: "Tendance primaire requise", type: "boolean", section: "ema",
    help: "Oblige le bot à trader uniquement dans la direction de la tendance EMA50/200. Si EMA50 > EMA200 → uniquement LONG. Désactiver pour permettre les contre-tendances.",
  },
  requirePriceZoneLong: {
    label: "Zone EMA requise (LONG)", type: "boolean", section: "ema",
    help: "Le prix doit être proche de l'EMA rapide pour déclencher un LONG. Si désactivé, le prix peut être n'importe où.",
  },
  requirePriceZoneShort: {
    label: "Zone EMA requise (SHORT)", type: "boolean", section: "ema",
    help: "Même chose que ci-dessus mais pour les SHORT.",
  },
  // HTF
  trendTfMultiplier: {
    label: "Multiplicateur HTF", unit: "×", type: "number", min: 1, max: 20, step: 1,
    section: "htf",
    help: "Multiplie le timeframe de base pour créer un timeframe supérieur. Avec 5min × 5 = 25min. Le bot vérifie que la tendance sur ce TF supérieur est alignée avec le signal.",
  },
  trendTfEmaPeriod: {
    label: "EMA du timeframe supérieur", unit: "bougies", type: "number", min: 20, max: 500, step: 5,
    section: "htf",
    help: "Période de l'EMA calculée sur le timeframe supérieur. Attention: il faut charger suffisamment de bougies (trendTfMultiplier × trendTfEmaPeriod + marge).",
  },
  requireTrendConfirmation: {
    label: "Confirmation HTF requise", type: "boolean", section: "htf",
    help: "Active la vérification de la tendance sur le timeframe supérieur. Recommandé: réduit significativement les faux signaux en s'assurant que la macro-tendance est alignée.",
  },
  // ATR
  atrPeriod: {
    label: "Période ATR", unit: "bougies", type: "number", min: 2, max: 50, step: 1,
    section: "atr",
    help: "Average True Range: mesure la volatilité du marché sur N bougies. Utilisé pour calculer la distance du Stop Loss et Take Profit. Standard: 14.",
  },
  atrSlMult: {
    label: "Multiplicateur ATR pour SL", unit: "×", type: "number", min: 0.5, max: 10, step: 0.1,
    section: "atr",
    help: "Distance du Stop Loss = ATR × ce multiplicateur. SL = prix d'entrée − (ATR × mult) pour LONG. Plus élevé = SL plus loin = moins de stop prématurés mais pertes plus grandes.",
  },
  atrTpMult: {
    label: "Multiplicateur ATR pour TP final", unit: "×", type: "number", min: 0.5, max: 20, step: 0.1,
    section: "atr",
    help: "Distance du TP final = ATR × ce multiplicateur. Utilisé uniquement si pas de template TP personnalisé. Le ratio TP/SL recommandé est > 1.5.",
  },
  trailingEnabled: {
    label: "Trailing stop activé", type: "boolean", section: "atr",
    help: "Le Stop Loss remonte automatiquement derrière le prix après que TP1 soit touché. Permet de laisser courir les gains tout en protégeant les bénéfices.",
  },
  trailingAtrMult: {
    label: "Distance trailing (ATR×)", unit: "×", type: "number", min: 0.5, max: 10, step: 0.1,
    section: "atr",
    help: "Le trailing stop se place à ATR × ce multiplicateur derrière le meilleur prix atteint. Plus petit = stop plus serré = profits sécurisés plus tôt mais sortie prématurée possible.",
  },
  // Risk
  riskPerTradePct: {
    label: "Risque par trade", unit: "%", type: "number", min: 0.1, max: 100, step: 0.1,
    section: "risk",
    help: "Pourcentage du capital risqué sur chaque trade. La taille de position est calculée pour que si le SL est touché, la perte soit exactement ce pourcentage. 10% = conservateur pour du levier élevé.",
  },
  maxNotionalUsdt: {
    label: "Notionnel max par trade", unit: "USDT", type: "number", min: 0, max: 100000, step: 100,
    section: "risk",
    help: "Limite la taille maximale d'une position (prix × quantité). Protège contre des positions trop grosses même si le capital est élevé.",
  },
  minProfitUsdt: {
    label: "Profit minimum requis", unit: "USDT", type: "number", min: 0, max: 100, step: 0.5,
    section: "risk",
    help: "Ignore les signaux dont le profit net attendu (après frais) serait inférieur à ce montant. Évite de prendre des petites positions où les frais mangent tout le gain.",
  },
};

const SECTIONS = [
  { id: "rsi", icon: "📊", label: "RSI — Force relative", color: "text-violet-400", bg: "bg-violet-500/10 border-violet-500/20",
    desc: "L'indicateur RSI mesure si le marché est en survente (opportunité LONG) ou en surachat (opportunité SHORT)." },
  { id: "ema", icon: "📈", label: "EMA — Tendance & Zone d'entrée", color: "text-blue-400", bg: "bg-blue-500/10 border-blue-500/20",
    desc: "Les moyennes mobiles exponentielles définissent la tendance principale et la zone de prix optimale pour entrer." },
  { id: "htf", icon: "🔭", label: "HTF — Confirmation multi-timeframe", color: "text-teal-400", bg: "bg-teal-500/10 border-teal-500/20",
    desc: "Vérifie que la tendance sur un timeframe supérieur est alignée avec le signal, réduisant les faux signaux." },
  { id: "atr", icon: "📏", label: "ATR — Stop Loss & Take Profit", color: "text-amber-400", bg: "bg-amber-500/10 border-amber-500/20",
    desc: "L'ATR mesure la volatilité et détermine les distances du SL et TP en fonction du mouvement naturel du marché." },
  { id: "risk", icon: "🛡", label: "Gestion du risque", color: "text-emerald-400", bg: "bg-emerald-500/10 border-emerald-500/20",
    desc: "Paramètres de sizing et de protection du capital. Ces valeurs s'appliquent par défaut mais peuvent être surchargées par session." },
];

interface Props {
  strategy?: any;
  mode: "create" | "edit";
  onClose?: () => void;
}

export function StrategyEditor({ strategy, mode, onClose }: Props) {
  const router = useRouter();
  const [activeSection, setActiveSection] = useState("rsi");
  const [form, setForm] = useState<any>(strategy ?? {
    name: "Ma stratégie",
    description: "",
    isDefault: false,
    rsiPeriod: 14, rsiOversold: 32, rsiOverbought: 68,
    enableRsiLong: true, enableRsiShort: true, requireRsiRebound: true,
    emaFastPeriod: 50, emaSlowPeriod: 200,
    emaTouchTolerancePct: 0.6, priceExtensionPct: 0.25,
    requirePriceCross: false, requirePrimaryTrend: true,
    requirePriceZoneLong: true, requirePriceZoneShort: true,
    trendTfMultiplier: 5, trendTfEmaPeriod: 200, requireTrendConfirmation: true,
    atrPeriod: 14, atrSlMult: 2.4, atrTpMult: 2.0,
    trailingEnabled: true, trailingAtrMult: 1.8,
    riskPerTradePct: 10, maxNotionalUsdt: 1000, minProfitUsdt: 4,
    tpTemplates: [
      { rMultiple: 0.8, ratio: 0.4, label: "TP1" },
      { rMultiple: 1.5, ratio: 0.35, label: "TP2" },
      { rMultiple: 2.2, ratio: 0.25, label: "TP3" },
    ],
  });
  const [tooltip, setTooltip] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const set = useCallback((key: string, value: any) => {
    setForm((f: any) => ({ ...f, [key]: value }));
  }, []);

  async function handleSave() {
    setSaving(true); setError("");
    try {
      const payload = {
        ...form,
        riskPerTradePct: form.riskPerTradePct / 100,
      };
      const url = mode === "edit" ? `/api/proxy/strategies/${strategy.id}` : "/api/proxy/strategies";
      const res = await fetch(url, {
        method: mode === "edit" ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error("Erreur lors de la sauvegarde");
      const saved = await res.json();
      router.push(`/strategies/${saved.id}`);
      router.refresh();
      onClose?.();
    } catch (e: any) {
      setError(e.message);
    } finally { setSaving(false); }
  }

  const paramsInSection = Object.entries(PARAMS).filter(([, p]) => p.section === activeSection);
  const section = SECTIONS.find(s => s.id === activeSection)!;

  // TP templates total ratio
  const tpTotal = (form.tpTemplates ?? []).reduce((s: number, t: any) => s + (Number(t.ratio) || 0), 0);

  return (
    <div className="flex h-full gap-6">
      {/* Left: section nav */}
      <div className="w-56 shrink-0 space-y-1.5">
        {SECTIONS.map(sec => (
          <button key={sec.id} onClick={() => setActiveSection(sec.id)}
            className={cn(
              "w-full rounded-xl border px-4 py-3 text-left transition-all",
              activeSection === sec.id
                ? `${sec.bg} border-current`
                : "border-transparent hover:bg-surface-2 hover:border-border"
            )}>
            <div className="flex items-center gap-2">
              <span className="text-base">{sec.icon}</span>
              <span className={cn("text-xs font-medium", activeSection === sec.id ? sec.color : "text-zinc-400")}>
                {sec.label.split(" — ")[0]}
              </span>
            </div>
            {activeSection === sec.id && (
              <p className="mt-1 text-[10px] text-zinc-500 leading-relaxed">{sec.label.split(" — ")[1]}</p>
            )}
          </button>
        ))}

        {/* TP Templates mini-nav */}
        <button onClick={() => setActiveSection("tp")}
          className={cn("w-full rounded-xl border px-4 py-3 text-left transition-all",
            activeSection === "tp"
              ? "bg-pink-500/10 border-pink-500/20"
              : "border-transparent hover:bg-surface-2 hover:border-border")}>
          <div className="flex items-center gap-2">
            <span className="text-base">🎯</span>
            <span className={cn("text-xs font-medium", activeSection === "tp" ? "text-pink-400" : "text-zinc-400")}>
              Objectifs TP
            </span>
          </div>
          {activeSection === "tp" && <p className="mt-1 text-[10px] text-zinc-500">Paliers de prise de profit</p>}
        </button>
      </div>

      {/* Right: params */}
      <div className="flex-1 min-w-0 space-y-5">
        {/* Section header */}
        {activeSection !== "tp" ? (
          <>
            <div className={cn("rounded-xl border p-4", section.bg)}>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-xl">{section.icon}</span>
                <h2 className={cn("text-sm font-semibold", section.color)}>{section.label}</h2>
              </div>
              <p className="text-xs text-zinc-400 leading-relaxed">{section.desc}</p>
            </div>

            {/* Params */}
            <div className="space-y-3">
              {paramsInSection.map(([key, param]) => (
                <ParamRow
                  key={key}
                  paramKey={key}
                  param={param}
                  value={form[key]}
                  onChange={(v) => set(key, v)}
                  isActive={tooltip === key}
                  onTooltip={(k) => setTooltip(tooltip === k ? null : k)}
                />
              ))}
            </div>
          </>
        ) : (
          <TpEditor
            templates={form.tpTemplates ?? []}
            onChange={(tps) => set("tpTemplates", tps)}
            total={tpTotal}
          />
        )}

        {/* Meta (always visible at bottom) */}
        {activeSection === "rsi" && (
          <div className="rounded-xl border border-border bg-surface-1 p-4 space-y-3">
            <h3 className="text-xs font-medium text-zinc-300">Informations générales</h3>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs text-zinc-500 mb-1.5">Nom de la stratégie</label>
                <input value={form.name} onChange={e => set("name", e.target.value)}
                  className="w-full rounded-lg border border-border bg-surface-2 px-3 py-2 text-sm text-zinc-200 outline-none focus:border-accent" />
              </div>
              <div>
                <label className="block text-xs text-zinc-500 mb-1.5">Description (optionnel)</label>
                <input value={form.description ?? ""} onChange={e => set("description", e.target.value)}
                  className="w-full rounded-lg border border-border bg-surface-2 px-3 py-2 text-sm text-zinc-200 outline-none focus:border-accent"
                  placeholder="Description courte..." />
              </div>
            </div>
          </div>
        )}

        {/* Save */}
        <div className="flex items-center justify-between pt-2 border-t border-border">
          {error && <p className="text-xs text-red-400">{error}</p>}
          <div className="flex gap-2 ml-auto">
            {onClose && (
              <button onClick={onClose}
                className="rounded-lg border border-border px-4 py-2 text-sm text-zinc-400 transition hover:text-zinc-200">
                Annuler
              </button>
            )}
            <button onClick={handleSave} disabled={saving}
              className="rounded-lg bg-accent px-6 py-2 text-sm font-medium text-white transition hover:bg-accent-hover disabled:opacity-50">
              {saving ? "Sauvegarde…" : mode === "edit" ? "Enregistrer les modifications" : "Créer la stratégie"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Param row ──────────────────────────────────────────────────────────────────
function ParamRow({ paramKey, param, value, onChange, isActive, onTooltip }: {
  paramKey: string; param: any; value: any; onChange: (v: any) => void;
  isActive: boolean; onTooltip: (k: string) => void;
}) {
  const inp = "rounded-lg border border-border bg-surface-2 px-3 py-2 text-sm font-mono text-zinc-200 outline-none transition focus:border-accent focus:ring-1 focus:ring-accent/20";

  if (param.type === "boolean") {
    return (
      <div className={cn("flex items-center justify-between rounded-xl border px-4 py-3 transition",
        isActive ? "border-accent/30 bg-accent/5" : "border-border bg-surface-1 hover:border-border")}>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-xs font-medium text-zinc-300">{param.label}</span>
            <button onClick={() => onTooltip(paramKey)}
              className="h-4 w-4 flex-shrink-0 rounded-full border border-zinc-700 text-[10px] text-zinc-600 hover:border-accent/50 hover:text-accent transition">?</button>
          </div>
          {isActive && <p className="mt-2 text-xs text-zinc-500 leading-relaxed">{param.help}</p>}
        </div>
        <button onClick={() => onChange(!value)}
          className={cn("ml-4 relative h-5 w-9 flex-shrink-0 rounded-full transition-colors",
            value ? "bg-accent" : "bg-surface-4")}>
          <span className={cn("absolute top-0.5 h-4 w-4 rounded-full bg-white shadow transition-all",
            value ? "left-4" : "left-0.5")} />
        </button>
      </div>
    );
  }

  return (
    <div className={cn("rounded-xl border px-4 py-3 transition",
      isActive ? "border-accent/30 bg-accent/5" : "border-border bg-surface-1 hover:border-border")}>
      <div className="flex items-center justify-between gap-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-xs font-medium text-zinc-300">{param.label}</span>
            {param.unit && <span className="text-[10px] text-zinc-600">{param.unit}</span>}
            <button onClick={() => onTooltip(paramKey)}
              className="h-4 w-4 flex-shrink-0 rounded-full border border-zinc-700 text-[10px] text-zinc-600 hover:border-accent/50 hover:text-accent transition">?</button>
          </div>
          {isActive && <p className="mt-2 text-xs text-zinc-500 leading-relaxed pr-4">{param.help}</p>}
        </div>
        <div className="flex items-center gap-3 flex-shrink-0">
          <input
            type="range" min={param.min} max={param.max} step={param.step}
            value={value ?? param.min}
            onChange={e => onChange(param.step < 1 ? parseFloat(e.target.value) : parseInt(e.target.value))}
            className="w-28 accent-accent"
          />
          <input
            type="number" min={param.min} max={param.max} step={param.step}
            value={value ?? ""}
            onChange={e => onChange(param.step < 1 ? parseFloat(e.target.value) : parseInt(e.target.value))}
            className={cn(inp, "w-20 text-right")}
          />
        </div>
      </div>
    </div>
  );
}

// ── TP Templates editor ────────────────────────────────────────────────────────
function TpEditor({ templates, onChange, total }: { templates: any[]; onChange: (t: any[]) => void; total: number }) {
  const addTp = () => onChange([...templates, { rMultiple: 2.0, ratio: 0.25, label: `TP${templates.length + 1}` }]);
  const removeTp = (i: number) => onChange(templates.filter((_, idx) => idx !== i));
  const updateTp = (i: number, field: string, value: any) =>
    onChange(templates.map((t, idx) => idx === i ? { ...t, [field]: value } : t));

  const totalRatio = templates.reduce((s, t) => s + (Number(t.ratio) || 0), 0);
  const isValid = Math.abs(totalRatio - 1) < 0.01;

  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-pink-500/20 bg-pink-500/5 p-4">
        <div className="flex items-center gap-2 mb-1">
          <span className="text-xl">🎯</span>
          <h2 className="text-sm font-semibold text-pink-400">Objectifs de Take Profit</h2>
        </div>
        <p className="text-xs text-zinc-400 leading-relaxed">
          Définissez des paliers de prise de profit partiels. Chaque TP ferme une fraction de la position.
          La somme des ratios doit être égale à 100%. Le R-multiple est le rapport TP/SL (ex: 1.5R = profit 1.5× la distance du SL).
        </p>
      </div>

      {/* Visual preview */}
      <div className="rounded-xl border border-border bg-surface-1 p-4">
        <div className="flex items-center justify-between mb-3">
          <p className="text-xs text-zinc-400">Aperçu des paliers</p>
          <span className={cn("text-xs font-mono", isValid ? "text-emerald-400" : "text-red-400")}>
            Total: {(totalRatio * 100).toFixed(0)}% {isValid ? "✓" : "≠ 100%"}
          </span>
        </div>
        <div className="flex gap-1 h-8">
          {templates.map((t, i) => (
            <div key={i}
              style={{ width: `${(t.ratio || 0) * 100}%` }}
              className={cn("rounded flex items-center justify-center text-[10px] font-mono text-white transition-all",
                i === 0 ? "bg-emerald-600" : i === 1 ? "bg-emerald-500" : i === 2 ? "bg-emerald-400" : "bg-teal-400")}>
              {t.label || `TP${i + 1}`}
            </div>
          ))}
          {totalRatio < 1 && (
            <div style={{ width: `${(1 - totalRatio) * 100}%` }}
              className="rounded bg-surface-3 flex items-center justify-center text-[10px] text-zinc-600">
              libre
            </div>
          )}
        </div>
      </div>

      {/* TP rows */}
      <div className="space-y-3">
        {templates.map((t, i) => (
          <div key={i} className="rounded-xl border border-border bg-surface-1 p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <span className={cn("h-2.5 w-2.5 rounded-full", i === 0 ? "bg-emerald-600" : i === 1 ? "bg-emerald-500" : i === 2 ? "bg-emerald-400" : "bg-teal-400")} />
                <span className="text-xs font-medium text-zinc-300">Palier {i + 1}</span>
              </div>
              <button onClick={() => removeTp(i)}
                className="text-xs text-zinc-600 hover:text-red-400 transition">✕ Supprimer</button>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="block text-[10px] text-zinc-600 mb-1.5">Label</label>
                <input value={t.label ?? ""} onChange={e => updateTp(i, "label", e.target.value)}
                  className="w-full rounded-lg border border-border bg-surface-2 px-2.5 py-1.5 text-xs font-mono text-zinc-200 outline-none focus:border-accent"
                  placeholder={`TP${i + 1}`} />
              </div>
              <div>
                <label className="block text-[10px] text-zinc-600 mb-1.5">R-multiple (×SL distance)</label>
                <div className="flex items-center gap-2">
                  <input type="range" min={0.1} max={10} step={0.1}
                    value={t.rMultiple || 1}
                    onChange={e => updateTp(i, "rMultiple", parseFloat(e.target.value))}
                    className="flex-1 accent-accent" />
                  <span className="font-mono text-sm text-emerald-400 w-10 text-right">{(t.rMultiple || 0).toFixed(1)}R</span>
                </div>
              </div>
              <div>
                <label className="block text-[10px] text-zinc-600 mb-1.5">Fraction de position (%)</label>
                <div className="flex items-center gap-2">
                  <input type="range" min={1} max={100} step={1}
                    value={Math.round((t.ratio || 0) * 100)}
                    onChange={e => updateTp(i, "ratio", parseInt(e.target.value) / 100)}
                    className="flex-1 accent-accent" />
                  <span className="font-mono text-sm text-zinc-200 w-10 text-right">{Math.round((t.ratio || 0) * 100)}%</span>
                </div>
              </div>
            </div>
            <div className="mt-3 pt-3 border-t border-border-subtle">
              <p className="text-[10px] text-zinc-600">
                Ferme <span className="text-zinc-400 font-medium">{Math.round((t.ratio || 0) * 100)}%</span> de la position
                quand le profit atteint <span className="text-emerald-400 font-medium">{(t.rMultiple || 0).toFixed(1)} fois</span> la distance du SL
              </p>
            </div>
          </div>
        ))}
      </div>

      {templates.length < 5 && (
        <button onClick={addTp}
          className="w-full rounded-xl border border-dashed border-border py-3 text-xs text-zinc-500 hover:border-pink-500/40 hover:text-pink-400 transition">
          + Ajouter un palier
        </button>
      )}
    </div>
  );
}
