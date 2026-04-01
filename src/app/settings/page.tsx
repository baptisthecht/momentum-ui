import { getProfile } from "@/lib/api";
import { BitgetKeysForm } from "./_components/bitget-keys-form";
import { Card, CardHeader, CardTitle } from "@/components/ui/shared";

export default async function SettingsPage() {
  let profile: any = null;
  try { profile = await getProfile(); } catch {}

  const hasKeys = !!(profile?.bitgetApiKey || profile?.hasBitgetKeys);

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-xl font-semibold text-zinc-100">Settings</h1>
        <p className="text-xs text-zinc-500 mt-0.5">Account configuration and API keys</p>
      </div>

      {/* Account info */}
      <Card>
        <CardHeader><CardTitle>Account</CardTitle></CardHeader>
        <div className="space-y-3">
          <div className="flex items-center justify-between py-2 border-b border-border-subtle">
            <span className="text-xs text-zinc-500">Email</span>
            <span className="text-sm text-zinc-200">{profile?.email ?? "—"}</span>
          </div>
          <div className="flex items-center justify-between py-2">
            <span className="text-xs text-zinc-500">Display name</span>
            <span className="text-sm text-zinc-200">{profile?.displayName ?? "—"}</span>
          </div>
        </div>
      </Card>

      {/* Bitget API Keys */}
      <Card>
        <CardHeader>
          <CardTitle>Bitget API Keys</CardTitle>
          {hasKeys && (
            <span className="flex items-center gap-1.5 rounded-md border border-emerald-500/20 bg-emerald-500/10 px-2 py-1 text-xs text-emerald-400">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
              Connected
            </span>
          )}
        </CardHeader>
        {!hasKeys && (
          <div className="mb-4 rounded-lg border border-amber-500/20 bg-amber-500/5 px-4 py-3">
            <p className="text-xs text-amber-400 font-medium">API keys required for real trading</p>
            <p className="text-xs text-zinc-500 mt-0.5">Simulation mode works without keys. For live trading, add your Bitget USDT-Futures API keys below.</p>
          </div>
        )}
        <BitgetKeysForm hasKeys={hasKeys} />
      </Card>

      {/* Info */}
      <div className="rounded-lg border border-border-subtle bg-surface-1 px-4 py-3">
        <p className="text-xs font-medium text-zinc-400 mb-1">Security note</p>
        <p className="text-xs text-zinc-600 leading-relaxed">
          Your API keys are stored encrypted. Use API keys with <strong className="text-zinc-500">Futures trading</strong> permissions only. 
          Never enable withdrawal permissions. Keys are never exposed in the UI after saving.
        </p>
      </div>
    </div>
  );
}
