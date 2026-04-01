export type SessionStatus = "running" | "stopped";
export type OrderSide = "long" | "short";
export type EvaluationResult = "signal_long" | "signal_short" | "rejected";

export interface User {
  id: string; email: string; displayName: string | null;
  hasBitgetKeys?: boolean; bitgetApiKey?: string; createdAt: string;
}

export interface Strategy {
  id: string; name: string; description: string | null; isDefault: boolean;
  rsiPeriod: number; rsiOverbought: number; rsiOversold: number;
  emaFastPeriod: number; emaSlowPeriod: number;
  emaTouchTolerancePct: number; priceExtensionPct: number;
  requirePriceCross: boolean; requireRsiRebound: boolean;
  requirePrimaryTrend: boolean; enableRsiLong: boolean; enableRsiShort: boolean;
  requirePriceZoneLong: boolean; requirePriceZoneShort: boolean;
  atrPeriod: number; atrTpMult: number; atrSlMult: number;
  tp1RMultiple: number; tp2RMultiple: number; tp1Ratio: number;
  trailingEnabled: boolean; trailingAtrMult: number;
  riskPerTradePct: number; maxNotionalUsdt: number; minProfitUsdt: number;
  tpTemplates: TpTemplate[]; symbolOverrides: SymbolOverride[]; createdAt: string;
}

export interface TpTemplate { id: string; sortOrder: number; rMultiple: number; ratio: number; label: string | null; }
export interface SymbolOverride {
  id: string; symbol: string; rsiOverbought: number | null; rsiOversold: number | null;
  emaTouchTolerancePct: number | null; priceExtensionPct: number | null;
  atrSlMult: number | null; atrTpMult: number | null; trailingAtrMult: number | null;
  tpTemplates: TpTemplate[];
}

export interface Session {
  id: string; userId: string; strategyId: string; strategy?: Strategy;
  symbol: string; leverage: number; status: SessionStatus; simulation: boolean;
  startingBalance: number; currentBalance: number; currentEquity: number;
  riskPerTradePct: number | null; maxNotionalUsdt: number | null; minProfitUsdt: number | null;
  maxRiskPerTradeUsdt: number | null; capitalFraction: number | null;
  // Risk manager state
  dailyPnl: number; tradesToday: number; consecutiveLosses: number;
  killSwitchTriggered: boolean; riskMultiplier: number;
  // Risk limits
  maxDailyLossPct: number | null; maxDailyLossUsdt: number | null;
  maxTradesPerDay: number | null; maxConsecutiveLosses: number | null;
  drawdownAutoReduceAfter: number | null; drawdownAutoReduceFactor: number | null;
  drawdownRecoveryTrades: number | null;
  createdAt: string; stoppedAt: string | null;
  positions?: Position[]; trades?: Trade[];
}

export interface Position {
  id: string; sessionId: string; symbol: string; side: OrderSide;
  qty: number; originalQty: number; entryPrice: number; sl: number; tp: number;
  leverage: number; openTime: string; isClosed: boolean;
  trailingActive: boolean; bestPrice: number; riskAmount: number;
  liqPrice: number | null; features: Record<string, number> | null;
  tpTargets?: PositionTpTarget[];
}

export interface PositionTpTarget {
  id: string; sortOrder: number; price: number; ratio: number;
  targetQty: number; filledQty: number; hit: boolean; label: string | null;
}

export interface Trade {
  id: string; sessionId: string; positionId: string; symbol: string; side: OrderSide;
  entryPrice: number; exitPrice: number; qty: number; leverage: number;
  sl: number; tp: number; pnl: number; pnlPct: number; fees: number; riskAmount: number;
  openTime: string; closeTime: string | null; reason: string | null; isPartial: boolean; createdAt: string;
}

export interface SignalEvaluation {
  id: string; sessionId: string; candleId: string; candle?: any; symbol: string;
  result: EvaluationResult; closePrice: number; rsiValue: number; atrValue: number;
  emaFastValue: number; emaSlowValue: number; checks: ConditionCheck[]; createdAt: string;
}

export interface ConditionCheck {
  id: string; evaluationId: string; side: string; conditionName: string;
  expectedValue: string; actualValue: string; passed: boolean;
}
