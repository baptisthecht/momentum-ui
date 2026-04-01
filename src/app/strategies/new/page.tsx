"use client";
import { StrategyEditor } from "../_components/strategy-editor";
import { useRouter } from "next/navigation";

export default function NewStrategyPage() {
  const router = useRouter();
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-zinc-100">Nouvelle stratégie</h1>
        <p className="mt-0.5 text-xs text-zinc-500">Configurez chaque paramètre avec les explications pour comprendre leur impact</p>
      </div>
      <StrategyEditor mode="create" onClose={() => router.push("/strategies")} />
    </div>
  );
}
