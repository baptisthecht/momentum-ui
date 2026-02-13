"use client";
import { LogOutIcon } from "lucide-react";
import { signOut } from "next-auth/react";

export function SignOut() {
  return (
    <button
      onClick={() => signOut()}
      type="button"
      className="flex aspect-square items-center justify-center gap-3 rounded-lg size-6 text-sm transition-colors text-zinc-500 hover:bg-surface-3 hover:text-zinc-300"
    >
      <LogOutIcon className="size-3.5" />
    </button>
  );
}
