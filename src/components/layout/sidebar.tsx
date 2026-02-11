import Link from "next/link";
import { auth } from "@/lib/auth";
import { NavLinks } from "./nav-links";

export async function Sidebar() {
  const session = await auth();
  const user = session?.user;

  return (
    <aside className="fixed inset-y-0 left-0 z-40 flex w-60 flex-col border-r border-border bg-surface-1">
      {/* Logo */}
      <div className="flex h-14 items-center gap-2.5 border-b border-border px-5">
        <div className="flex h-7 w-7 items-center justify-center rounded-md bg-accent text-xs font-bold text-white">
          M
        </div>
        <span className="text-sm font-semibold tracking-tight text-zinc-100">Momentum</span>
        <span className="ml-auto rounded bg-surface-3 px-1.5 py-0.5 font-mono text-[10px] text-zinc-500">v2</span>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto px-3 py-4">
        <NavLinks />
      </nav>

      {/* User */}
      <div className="border-t border-border p-4">
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-surface-3 text-xs font-medium text-zinc-400">
            {user?.email?.charAt(0).toUpperCase() ?? "?"}
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-xs font-medium text-zinc-300">{user?.name ?? user?.email ?? "User"}</p>
            <p className="truncate text-[10px] text-zinc-600">{user?.email}</p>
          </div>
        </div>
      </div>
    </aside>
  );
}
