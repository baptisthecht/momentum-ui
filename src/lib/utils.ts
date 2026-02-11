import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function fmt(n: number, decimals = 2): string {
  return n.toLocaleString("en-US", { minimumFractionDigits: decimals, maximumFractionDigits: decimals });
}

export function fmtUsd(n: number): string {
  return `$${fmt(n)}`;
}

export function fmtPct(n: number): string {
  const sign = n >= 0 ? "+" : "";
  return `${sign}${fmt(n)}%`;
}

export function fmtDate(d: string | Date): string {
  return new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });
}

export function fmtDateShort(d: string | Date): string {
  return new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

export function fmtTime(d: string | Date): string {
  return new Date(d).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" });
}

export function pnlColor(pnl: number): string {
  if (pnl > 0) return "text-emerald-400";
  if (pnl < 0) return "text-red-400";
  return "text-zinc-500";
}

export function sideColor(side: string): string {
  return side === "long" ? "text-emerald-400" : "text-red-400";
}

export function sideBg(side: string): string {
  return side === "long" ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" : "bg-red-500/10 text-red-400 border-red-500/20";
}
