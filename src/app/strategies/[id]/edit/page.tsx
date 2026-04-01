"use client";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { StrategyEditor } from "../../_components/strategy-editor";
import { EmptyState } from "@/components/ui/shared";

export default function EditStrategyPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [strategy, setStrategy] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/proxy/strategies/${id}`)
      .then(r => r.json())
      .then(d => {
        // Convert riskPerTradePct from decimal to % for the form
        setStrategy({ ...d, riskPerTradePct: (d.riskPerTradePct ?? 0.1) * 100 });
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return <div className="animate-pulse h-96 rounded-xl bg-surface-1" />;
  if (!strategy) return <EmptyState icon="⚙" title="Stratégie introuvable" description="" />;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-zinc-100">Éditer — {strategy.name}</h1>
        <p className="mt-0.5 text-xs text-zinc-500">Modifiez les paramètres et sauvegardez</p>
      </div>
      <StrategyEditor strategy={strategy} mode="edit" onClose={() => router.push(`/strategies/${id}`)} />
    </div>
  );
}
