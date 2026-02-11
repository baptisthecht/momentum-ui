"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import { fmtTime, fmt } from "@/lib/utils";
import { ConditionChecks, ResultBadge } from "@/components/shared/condition-checks";
import type { SignalEvaluation } from "@/types/api";

export function EvaluationTimeline({ evaluations }: { evaluations: SignalEvaluation[] }) {
  const [selected, setSelected] = useState<string | null>(evaluations[0]?.id ?? null);
  const active = evaluations.find((e) => e.id === selected);

  if (evaluations.length === 0) {
    return <p className="py-8 text-center text-xs text-zinc-600">No evaluations yet — waiting for candle data.</p>;
  }

  return (
    <div className="flex gap-4">
      {/* Left: scrollable timeline */}
      <div className="w-56 shrink-0 space-y-0.5 max-h-[600px] overflow-y-auto pr-2">
        {evaluations.map((ev) => {
          const isActive = ev.id === selected;
          const isSignal = ev.result !== "rejected";
          return (
            <button
              key={ev.id}
              onClick={() => setSelected(ev.id)}
              className={cn(
                "flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-xs transition-all",
                isActive ? "bg-accent/10 border border-accent/30" : "hover:bg-surface-3 border border-transparent",
              )}
            >
              {/* Signal indicator */}
              <span className={cn(
                "h-2 w-2 shrink-0 rounded-full",
                ev.result === "signal_long" ? "bg-emerald-400" : ev.result === "signal_short" ? "bg-red-400" : "bg-zinc-700",
              )} />

              {/* Time */}
              <span className="font-mono text-zinc-400">{fmtTime(ev.createdAt)}</span>

              {/* Price */}
              <span className="ml-auto font-mono text-zinc-500">{fmt(ev.closePrice, 1)}</span>
            </button>
          );
        })}
      </div>

      {/* Right: selected evaluation detail */}
      <div className="flex-1 min-w-0">
        {active ? (
          <div className="space-y-5">
            {/* Header */}
            <div className="flex items-center justify-between">
              <ResultBadge result={active.result} />
              <span className="font-mono text-xs text-zinc-500">{fmtTime(active.createdAt)}</span>
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
                {/* Long conditions */}
                {active.checks.some((c) => c.side === "long") && (
                  <div>
                    <h4 className="mb-2 flex items-center gap-2 text-xs font-medium text-emerald-400">
                      <span className="h-1 w-4 rounded-full bg-emerald-400/50" />
                      LONG Conditions
                    </h4>
                    <ConditionChecks checks={active.checks} side="long" />
                  </div>
                )}

                {/* Short conditions */}
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
  );
}
