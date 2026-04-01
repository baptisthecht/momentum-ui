"use client";
import { useState } from "react";

export function BitgetKeysForm({ hasKeys }: { hasKeys: boolean }) {
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [status, setStatus] = useState<{ type: "success" | "error"; message: string } | null>(null);
  const [showKeys, setShowKeys] = useState(!hasKeys);

  const inp = "w-full rounded-lg border border-border bg-surface-2 px-3 py-2 text-sm text-zinc-200 outline-none font-mono transition focus:border-accent focus:ring-1 focus:ring-accent/30 placeholder:text-zinc-600";

  async function handleSave(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSaving(true); setStatus(null);
    const form = new FormData(e.currentTarget);
    try {
      const res = await fetch("/api/proxy/users/me/bitget-keys", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          apiKey: form.get("apiKey"),
          apiSecret: form.get("apiSecret"),
          passphrase: form.get("passphrase"),
        }),
      });
      if (!res.ok) throw new Error("Failed to save keys");
      setStatus({ type: "success", message: "API keys saved successfully" });
      setShowKeys(false);
    } catch (err: any) {
      setStatus({ type: "error", message: err.message ?? "Failed to save" });
    } finally { setSaving(false); }
  }

  async function handleTest(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setTesting(true); setStatus(null);
    const form = new FormData(e.currentTarget);
    try {
      const res = await fetch("/api/proxy/users/me/test-credentials", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          apiKey: form.get("apiKey"),
          apiSecret: form.get("apiSecret"),
          passphrase: form.get("passphrase"),
        }),
      });
      const data = await res.json();
      if (data.ok) {
        const bal = data.data?.available ?? data.data?.equity;
        setStatus({ type: "success", message: `Connected! Balance: ${bal ? `$${parseFloat(bal).toFixed(2)}` : "OK"}` });
      } else {
        setStatus({ type: "error", message: data.error ?? "Connection failed" });
      }
    } catch (err: any) {
      setStatus({ type: "error", message: err.message });
    } finally { setTesting(false); }
  }

  return (
    <div className="space-y-4">
      {hasKeys && !showKeys ? (
        <div className="space-y-3">
          <div className="flex items-center justify-between rounded-lg bg-surface-2 px-4 py-3">
            <div>
              <p className="text-xs text-zinc-500">API Key</p>
              <p className="font-mono text-sm text-zinc-300">••••••••••••••••</p>
            </div>
            <button onClick={() => setShowKeys(true)}
              className="text-xs text-accent hover:text-accent-hover">
              Update keys
            </button>
          </div>
        </div>
      ) : (
        <form onSubmit={handleSave} className="space-y-3" id="keys-form">
          <div>
            <label className="mb-1.5 block text-xs text-zinc-500">API Key</label>
            <input name="apiKey" type="text" required className={inp} placeholder="bg_..." autoComplete="off" />
          </div>
          <div>
            <label className="mb-1.5 block text-xs text-zinc-500">API Secret</label>
            <input name="apiSecret" type="password" required className={inp} placeholder="••••••••••••••••" autoComplete="off" />
          </div>
          <div>
            <label className="mb-1.5 block text-xs text-zinc-500">Passphrase</label>
            <input name="passphrase" type="password" required className={inp} placeholder="Your API passphrase" autoComplete="off" />
          </div>

          {status && (
            <div className={`rounded-lg px-3 py-2 text-xs ${status.type === "success" ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20" : "bg-red-500/10 text-red-400 border border-red-500/20"}`}>
              {status.message}
            </div>
          )}

          <div className="flex gap-2 pt-1">
            <button type="submit" disabled={saving}
              className="flex-1 rounded-lg bg-accent py-2 text-xs font-medium text-white transition hover:bg-accent-hover disabled:opacity-50">
              {saving ? "Saving…" : "Save keys"}
            </button>
            <button
              type="button"
              disabled={testing}
              onClick={(e) => {
                const form = (e.currentTarget.closest("form") ?? document.getElementById("keys-form")) as HTMLFormElement;
                if (form) handleTest({ preventDefault: () => {}, currentTarget: form } as any);
              }}
              className="rounded-lg border border-border px-3 py-2 text-xs text-zinc-400 transition hover:border-accent/30 hover:text-zinc-200 disabled:opacity-50">
              {testing ? "Testing…" : "Test connection"}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
