import { cn } from "@/lib/utils";
import type { ConditionCheck } from "@/types/api";

export function ConditionChecks({ checks, side }: { checks: ConditionCheck[]; side: string }) {
  const filtered = checks.filter((c) => c.side === side);
  if (filtered.length === 0) return null;

  return (
    <div className="space-y-1.5">
      {filtered.map((c) => (
        <div
          key={c.id ?? c.conditionName}
          className={cn(
            "flex items-center gap-3 rounded-lg border px-3 py-2 font-mono text-xs transition-all",
            c.passed
              ? "border-emerald-500/20 bg-emerald-500/5 text-emerald-300"
              : "border-red-500/20 bg-red-500/5 text-red-300",
          )}
        >
          {/* Pass/fail indicator */}
          <span className={cn("flex h-5 w-5 shrink-0 items-center justify-center rounded text-[10px] font-bold", c.passed ? "bg-emerald-500/20 text-emerald-400" : "bg-red-500/20 text-red-400")}>
            {c.passed ? "✓" : "✗"}
          </span>

          {/* Condition name */}
          <span className="min-w-[140px] text-zinc-400">{formatConditionName(c.conditionName)}</span>

          {/* Expected */}
          <span className="text-zinc-600">expected</span>
          <span className={cn("rounded bg-surface-3 px-1.5 py-0.5", c.passed ? "text-emerald-300" : "text-zinc-300")}>
            {c.expectedValue}
          </span>

          {/* Got */}
          <span className="text-zinc-600">got</span>
          <span className={cn("rounded bg-surface-3 px-1.5 py-0.5 font-semibold", c.passed ? "text-emerald-300" : "text-red-300")}>
            {c.actualValue}
          </span>
        </div>
      ))}
    </div>
  );
}

function formatConditionName(name: string): string {
  return name
    .replace(/_/g, " ")
    .replace(/\b(htf|rsi|ema|atr)\b/gi, (m) => m.toUpperCase());
}

export function EvaluationSummary({
  result,
  longChecks,
  shortChecks,
}: {
  result: string;
  longChecks: ConditionCheck[];
  shortChecks: ConditionCheck[];
}) {
  const longPassed = longChecks.filter((c) => c.passed).length;
  const shortPassed = shortChecks.filter((c) => c.passed).length;

  return (
    <div className="flex items-center gap-4">
      <ResultBadge result={result} />
      <div className="flex gap-3 text-xs">
        <span className="text-zinc-500">
          LONG: <span className="text-emerald-400">{longPassed}</span>/{longChecks.length}
        </span>
        <span className="text-zinc-500">
          SHORT: <span className="text-emerald-400">{shortPassed}</span>/{shortChecks.length}
        </span>
      </div>
    </div>
  );
}

export function ResultBadge({ result }: { result: string }) {
  if (result === "signal_long") {
    return <span className="rounded-md bg-emerald-500/15 border border-emerald-500/30 px-2.5 py-1 text-xs font-semibold text-emerald-400">⬆ LONG SIGNAL</span>;
  }
  if (result === "signal_short") {
    return <span className="rounded-md bg-red-500/15 border border-red-500/30 px-2.5 py-1 text-xs font-semibold text-red-400">⬇ SHORT SIGNAL</span>;
  }
  return <span className="rounded-md bg-zinc-500/10 border border-zinc-500/20 px-2.5 py-1 text-xs font-medium text-zinc-500">— REJECTED</span>;
}
