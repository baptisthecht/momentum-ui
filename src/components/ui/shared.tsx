import { cn } from "@/lib/utils";

// ── Card ──
export function Card({ className, children, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn("rounded-[var(--radius-card)] border border-border bg-surface-1 p-5", className)} {...props}>
      {children}
    </div>
  );
}

export function CardHeader({ className, children }: { className?: string; children: React.ReactNode }) {
  return <div className={cn("mb-4 flex items-center justify-between", className)}>{children}</div>;
}

export function CardTitle({ children, className }: { children: React.ReactNode; className?: string }) {
  return <h3 className={cn("text-sm font-medium text-zinc-300", className)}>{children}</h3>;
}

// ── Badge ──
export function Badge({
  variant = "default",
  className,
  children,
}: {
  variant?: "default" | "success" | "danger" | "warning" | "muted";
  className?: string;
  children: React.ReactNode;
}) {
  const v = {
    default: "bg-accent/10 text-accent border-accent/20",
    success: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
    danger: "bg-red-500/10 text-red-400 border-red-500/20",
    warning: "bg-amber-500/10 text-amber-400 border-amber-500/20",
    muted: "bg-zinc-500/10 text-zinc-500 border-zinc-500/20",
  };
  return (
    <span className={cn("inline-flex items-center rounded-md border px-2 py-0.5 text-xs font-medium", v[variant], className)}>
      {children}
    </span>
  );
}

// ── Status indicator ──
export function StatusDot({ status }: { status: "running" | "stopped" | "connected" | "disconnected" }) {
  const colors = {
    running: "bg-emerald-400 shadow-emerald-400/50",
    connected: "bg-emerald-400 shadow-emerald-400/50",
    stopped: "bg-zinc-600",
    disconnected: "bg-red-400 shadow-red-400/50",
  };
  const pulse = status === "running" || status === "connected";
  return (
    <span className="relative flex h-2 w-2">
      {pulse && <span className={cn("absolute inline-flex h-full w-full animate-ping rounded-full opacity-75", colors[status])} />}
      <span className={cn("relative inline-flex h-2 w-2 rounded-full shadow-sm", colors[status])} />
    </span>
  );
}

// ── Stat card ──
export function Stat({
  label,
  value,
  sub,
  trend,
}: {
  label: string;
  value: string;
  sub?: string;
  trend?: "up" | "down" | "neutral";
}) {
  const tc = trend === "up" ? "text-emerald-400" : trend === "down" ? "text-red-400" : "text-zinc-500";
  return (
    <div>
      <p className="text-xs text-zinc-500 mb-1">{label}</p>
      <p className="text-xl font-semibold tracking-tight text-zinc-100">{value}</p>
      {sub && <p className={cn("mt-0.5 text-xs font-medium", tc)}>{sub}</p>}
    </div>
  );
}

// ── Empty state ──
export function EmptyState({ icon, title, description }: { icon: string; title: string; description: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <span className="mb-3 text-3xl">{icon}</span>
      <p className="text-sm font-medium text-zinc-400">{title}</p>
      <p className="mt-1 text-xs text-zinc-600">{description}</p>
    </div>
  );
}

// ── Table helpers ──
export function Table({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={cn("overflow-x-auto", className)}>
      <table className="w-full text-sm">{children}</table>
    </div>
  );
}

export function Th({ children, className }: { children: React.ReactNode; className?: string }) {
  return <th className={cn("px-3 py-2 text-left text-xs font-medium text-zinc-500", className)}>{children}</th>;
}

export function Td({ children, className }: { children: React.ReactNode; className?: string }) {
  return <td className={cn("px-3 py-2.5 text-zinc-300", className)}>{children}</td>;
}
