"use client";

import { cn } from "@/lib/utils";

export function RejectionBreakdown({ data, total }: { data: { name: string; count: number }[]; total: number }) {
  const max = data[0]?.count ?? 1;

  return (
    <div className="space-y-2.5">
      {data.slice(0, 10).map((d) => {
        const pct = total > 0 ? (d.count / total) * 100 : 0;
        const width = (d.count / max) * 100;
        return (
          <div key={d.name} className="group">
            <div className="flex items-center justify-between mb-1">
              <span className="font-mono text-xs text-zinc-400">{formatName(d.name)}</span>
              <span className="font-mono text-xs text-zinc-500">{d.count} ({pct.toFixed(0)}%)</span>
            </div>
            <div className="h-1.5 w-full rounded-full bg-surface-3 overflow-hidden">
              <div
                className="h-full rounded-full bg-red-500/60 transition-all group-hover:bg-red-400"
                style={{ width: `${width}%` }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}

function formatName(name: string): string {
  return name.replace(/_/g, " ").replace(/\b(htf|rsi|ema|atr)\b/gi, (m) => m.toUpperCase());
}
