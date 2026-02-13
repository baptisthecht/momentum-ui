"use client";

import { useState, useEffect, useCallback } from "react";
import { cn, fmtTime, fmt } from "@/lib/utils";
import { ConditionChecks, ResultBadge } from "@/components/shared/condition-checks";
import type { SignalEvaluation } from "@/types/api";

type Filter = "all" | "signals" | "rejected";

export function EvaluationTimeline({
  evaluations: initial,
  sessionId,
}: {
  evaluations: SignalEvaluation[];
  sessionId: string;
}) {
  const [filter, setFilter] = useState<Filter>("all");
  const [evaluations, setEvaluations] = useState(initial);
  const [loading, setLoading] = useState(false);
  const [selected, setSelected] = useState<string | null>(null);

  // Fetch filtered evaluations client-side when filter changes
  const fetchFiltered = useCallback(async (f: Filter) => {
    setLoading(true);
    try {
      const param = f === "all" ? "" : f === "signals" ? "&result=signals" : "&result=rejected";
      const res = await fetch(`/api/proxy/signal-evaluations/session/${sessionId}?limit=100${param}`);
      if (res.ok) {
        const data = await res.json();
        setEvaluations(data);
        setSelected(data[0]?.id ?? null);
      }
    } catch {
      // Fallback: filter locally
      if (f === "all") {
        setEvaluations(initial);
      } else if (f === "signals") {
        setEvaluations(initial.filter((e) => e.result !== "rejected"));
      } else {
        setEvaluations(initial.filter((e) => e.result === "rejected"));
      }
    }
    setLoading(false);
  }, [sessionId, initial]);

  // On filter change
  useEffect(() => {
    if (filter === "all") {
      setEvaluations(initial);
      setSelected(initial[0]?.id ?? null);
    } else {
      // Local filter first (instant), then optionally fetch for more
      const filtered = filter === "signals"
        ? initial.filter((e) => e.result !== "rejected")
        : initial.filter((e) => e.result === "rejected");
      setEvaluations(filtered);
      setSelected(filtered[0]?.id ?? null);
    }
  }, [filter, initial]);

  const active = evaluations.find((e) => e.id === selected);
  const evalTime = (ev: SignalEvaluation) => ev.candle?.openTime ?? ev.createdAt;

  if (initial.length === 0) {
    return <p className="py-8 text-center text-xs text-zinc-600">No evaluations yet — waiting for candle data.</p>;
  }

  return (
    <div className="space-y-4">
      {/* Filter tabs */}
      <div className="flex items-center gap-1 rounded-lg bg-surface-2 p-1 w-fit">
        {([
          { key: "all", label: "All", count: initial.length },
          { key: "signals", label: "Signals", count: initial.filter((e) => e.result !== "rejected").length },
          { key: "rejected", label: "Rejected", count: initial.filter((e) => e.result === "rejected").length },
        ] as { key: Filter; label: string; count: number }[]).map((tab) => (
          <button
            key={tab.key}
            onClick={() => setFilter(tab.key)}
            className={cn(
              "rounded-md px-3 py-1.5 text-xs font-medium transition-all",
              filter === tab.key
                ? "bg-surface-4 text-zinc-100 shadow-sm"
                : "text-zinc-500 hover:text-zinc-300",
            )}
          >
            {tab.label}
            <span className={cn(
              "ml-1.5 rounded px-1 py-0.5 text-[10px]",
              filter === tab.key ? "bg-accent/20 text-accent" : "bg-surface-3 text-zinc-600",
            )}>
              {tab.count}
            </span>
          </button>
        ))}
      </div>

      {/* Timeline + Detail */}
      <div className="flex gap-4">
        {/* Left: scrollable timeline */}
        <div className="w-60 shrink-0 space-y-0.5 max-h-[650px] overflow-y-auto pr-2">
          {evaluations.length === 0 ? (
            <p className="py-6 text-center text-xs text-zinc-600">
              {filter === "signals" ? "No signals generated yet" : "No evaluations match this filter"}
            </p>
          ) : (
            evaluations.map((ev) => {
              const isActive = ev.id === selected;
              return (
                <button
                  key={ev.id}
                  onClick={() => setSelected(ev.id)}
                  className={cn(
                    "flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-xs transition-all",
                    isActive ? "bg-accent/10 border border-accent/30" : "hover:bg-surface-3 border border-transparent",
                  )}
                >
                  <span className={cn(
                    "h-2 w-2 shrink-0 rounded-full",
                    ev.result === "signal_long" ? "bg-emerald-400"
                      : ev.result === "signal_short" ? "bg-red-400"
                      : "bg-zinc-700",
                  )} />
                  <span className="font-mono text-zinc-400">{fmtTime(evalTime(ev))}</span>
                  <span className="ml-auto font-mono text-zinc-500">{fmt(ev.closePrice, 1)}</span>
                </button>
              );
            })
          )}
        </div>

        {/* Right: detail */}
        <div className="flex-1 min-w-0">
          {active ? (
            <div className="space-y-5">
              <div className="flex items-center justify-between">
                <ResultBadge result={active.result} />
                <span className="font-mono text-xs text-zinc-500">Candle {fmtTime(evalTime(active))}</span>
              </div>

              {/* Market snapshot */}
              <div className="grid grid-cols-5 gap-3">
                {[
                  { label: "Close", value: fmt(active.closePrice, 2) },
                  { label: "RSI", value: fmt(active.rsiValue, 1) },
                  { label: "ATR", value: fmt(active.atrValue, 4) },
                  { label: "EMA Fast", value: fmt(active.emaFastValue, 2) },
                  { label: "EMA Slow", value: fmt(active.emaSlowValue, 2) },
                ].map((s) => (
                  <div key={s.label} className="rounded-lg bg-surface-2 px-3 py-2">
                    <p className="text-[10px] uppercase tracking-wide text-zinc-600">{s.label}</p>
                    <p className="mt-0.5 font-mono text-sm text-zinc-200">{s.value}</p>
                  </div>
                ))}
              </div>

              {/* Condition checks */}
              {active.checks && active.checks.length > 0 ? (
                <div className="space-y-4">
                  {active.checks.some((c) => c.side === "long") && (
                    <div>
                      <h4 className="mb-2 flex items-center gap-2 text-xs font-medium text-emerald-400">
                        <span className="h-1 w-4 rounded-full bg-emerald-400/50" />
                        LONG Conditions
                      </h4>
                      <ConditionChecks checks={active.checks} side="long" />
                    </div>
                  )}
                  {active.checks.some((c) => c.side === "short") && (
                    <div>
                      <h4 className="mb-2 flex items-center gap-2 text-xs font-medium text-red-400">
                        <span className="h-1 w-4 rounded-full bg-red-400/50" />
                        SHORT Conditions
                      </h4>
                      <ConditionChecks checks={active.checks} side="short" />
                    </div>
                  )}
                </div>
              ) : (
                <p className="py-6 text-center text-xs text-zinc-600">No condition checks available</p>
              )}
            </div>
          ) : (
            <p className="py-8 text-center text-xs text-zinc-500">Select a candle to view its evaluation</p>
          )}
        </div>
      </div>
    </div>
  );
}
