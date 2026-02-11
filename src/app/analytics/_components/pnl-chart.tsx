"use client";

import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { fmtUsd } from "@/lib/utils";

export function PnlChart({ data }: { data: { date: string; pnl: number }[] }) {
  const isPositive = data.length > 0 && data[data.length - 1].pnl >= 0;

  return (
    <div className="h-64">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id="pnlGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={isPositive ? "#34d399" : "#f87171"} stopOpacity={0.3} />
              <stop offset="100%" stopColor={isPositive ? "#34d399" : "#f87171"} stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
          <XAxis dataKey="date" tick={false} stroke="#3f3f46" />
          <YAxis tick={{ fill: "#71717a", fontSize: 10 }} stroke="#3f3f46" tickFormatter={(v) => `$${v}`} />
          <Tooltip
            contentStyle={{ background: "#18181b", border: "1px solid #27272a", borderRadius: 8, fontSize: 12 }}
            labelFormatter={() => ""}
            formatter={(v: number) => [fmtUsd(v), "P&L"]}
          />
          <Area
            type="monotone"
            dataKey="pnl"
            stroke={isPositive ? "#34d399" : "#f87171"}
            strokeWidth={2}
            fill="url(#pnlGrad)"
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
