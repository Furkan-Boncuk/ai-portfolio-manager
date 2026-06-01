export type SignalDirection = "long" | "short";
export type SignalType = "scalp" | "swing";

export interface RawSignal {
  assetId: string;
  strategyConfigId: string;
  signalType: SignalType;
  direction: SignalDirection;
  timeframe: string;
  entryLow: number;
  entryHigh: number;
  invalidationPrice: number;
  takeProfit1: number;
  takeProfit2?: number;
  riskLevel: "low" | "medium" | "high";
  confidence: number;
  reasonSummary: string;
  evidence: Record<string, unknown>;
}

export interface StrategyConfig {
  id: string;
  name: string;
  strategyType: SignalType;
  timeframe: string;
  params: Record<string, number>;
  maxSignalsPerDay: number;
  cooldownMinutes: number;
}

export interface StrategyResult {
  signal: RawSignal | null;
  rejectReason?: string;
}
