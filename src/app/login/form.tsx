"use client";

import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useState } from "react";

export function LoginForm() {
  const router = useRouter();
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    setLoading(true);

    const form = new FormData(e.currentTarget);
    const res = await signIn("credentials", {
      email: form.get("email"),
      password: form.get("password"),
      redirect: false,
    });

    if (res?.error) {
      setError("Invalid email or password");
      setLoading(false);
    } else {
      router.push("/");
      router.refresh();
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label htmlFor="email" className="mb-1.5 block text-xs text-zinc-500">Email</label>
        <input
          id="email" name="email" type="email" required autoFocus
          className="w-full rounded-lg border border-border bg-surface-2 px-3 py-2 text-sm text-zinc-200 outline-none transition focus:border-accent focus:ring-1 focus:ring-accent/30"
          placeholder="you@example.com"
        />
      </div>
      <div>
        <label htmlFor="password" className="mb-1.5 block text-xs text-zinc-500">Password</label>
        <input
          id="password" name="password" type="password" required
          className="w-full rounded-lg border border-border bg-surface-2 px-3 py-2 text-sm text-zinc-200 outline-none transition focus:border-accent focus:ring-1 focus:ring-accent/30"
          placeholder="••••••••"
        />
      </div>

      {error && <p className="text-xs text-red-400">{error}</p>}

      <button
        type="submit"
        disabled={loading}
        className="w-full rounded-lg bg-accent py-2.5 text-sm font-medium text-white transition hover:bg-accent-hover disabled:opacity-50"
      >
        {loading ? "Signing in…" : "Sign in"}
      </button>
    </form>
  );
}
