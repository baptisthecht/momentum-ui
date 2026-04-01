"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";

export function RegisterForm() {
  const router = useRouter();
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(""); setLoading(true);
    const form = new FormData(e.currentTarget);
    const email = form.get("email") as string;
    const password = form.get("password") as string;
    const displayName = form.get("displayName") as string;

    try {
      const res = await fetch("/api/proxy/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password, displayName }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.message ?? "Registration failed");
      }
      // Auto-login after register
      const result = await signIn("credentials", { email, password, redirect: false });
      if (result?.error) { setError("Registered but login failed — try signing in manually."); }
      else { router.push("/settings"); router.refresh(); }
    } catch (err: any) {
      setError(err.message ?? "Registration failed");
    } finally {
      setLoading(false);
    }
  }

  const inp = "w-full rounded-lg border border-border bg-surface-2 px-3 py-2 text-sm text-zinc-200 outline-none transition focus:border-accent focus:ring-1 focus:ring-accent/30";

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="mb-1.5 block text-xs text-zinc-500">Display name</label>
        <input name="displayName" type="text" className={inp} placeholder="Your name" />
      </div>
      <div>
        <label className="mb-1.5 block text-xs text-zinc-500">Email</label>
        <input name="email" type="email" required autoFocus className={inp} placeholder="you@example.com" />
      </div>
      <div>
        <label className="mb-1.5 block text-xs text-zinc-500">Password</label>
        <input name="password" type="password" required minLength={8} className={inp} placeholder="Min. 8 characters" />
      </div>
      {error && <p className="text-xs text-red-400">{error}</p>}
      <button type="submit" disabled={loading}
        className="w-full rounded-lg bg-accent py-2.5 text-sm font-medium text-white transition hover:bg-accent-hover disabled:opacity-50">
        {loading ? "Creating account…" : "Create account"}
      </button>
    </form>
  );
}
