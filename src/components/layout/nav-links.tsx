"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const links = [
  { href: "/", label: "Dashboard", icon: "◉" },
  { href: "/bot", label: "Bot Monitor", icon: "⬡" },
  { href: "/trades", label: "Trades", icon: "⇄" },
  { href: "/positions", label: "Positions", icon: "◎" },
  { href: "/strategies", label: "Strategies", icon: "⚙" },
  { href: "/analytics", label: "Analytics", icon: "◈" },
];

export function NavLinks() {
  const pathname = usePathname();

  return (
    <ul className="space-y-0.5">
      {links.map((l) => {
        const active = l.href === "/" ? pathname === "/" : pathname.startsWith(l.href);
        return (
          <li key={l.href}>
            <Link
              href={l.href}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors",
                active
                  ? "bg-accent/10 text-accent font-medium"
                  : "text-zinc-500 hover:bg-surface-3 hover:text-zinc-300",
              )}
            >
              <span className="text-base leading-none">{l.icon}</span>
              {l.label}
            </Link>
          </li>
        );
      })}
    </ul>
  );
}
