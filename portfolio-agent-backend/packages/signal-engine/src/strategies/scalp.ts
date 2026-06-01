import { calcEMA, calcRSI, calcATR, detectVolumeSpike, detectTrend } from "../indicators";
import type { CandleData } from "../indicators";
import type { RawSignal, StrategyConfig, StrategyResult } from "../types";

export function evaluateScalp(
  candles: CandleData[],
  config: StrategyConfig,
  assetId: string,
  currentPrice: number
): StrategyResult {
  const params = config.params;
  const emaFastPeriod = params.emaFast ?? 9;
  const emaSlowPeriod = params.emaSlow ?? 21;
  const rsiPeriod = params.rsiPeriod ?? 14;
  const rsiRecoveryThreshold = params.rsiRecoveryThreshold ?? 35;
  const volumeLookback = params.volumeLookback ?? 20;
  const volumeSpikeMultiplier = params.volumeSpikeMultiplier ?? 1.5;
  const atrPeriod = params.atrPeriod ?? 14;
  const minRiskReward = params.minRiskReward ?? 1.5;

  const closes = candles.map((c) => c.close);
  const volumes = candles.map((c) => c.volume);

  if (closes.length < Math.max(emaSlowPeriod, rsiPeriod, atrPeriod) + 1) {
    return { signal: null, rejectReason: "Insufficient candle data" };
  }

  const emaFast = calcEMA(closes, emaFastPeriod);
  const emaSlow = calcEMA(closes, emaSlowPeriod);
  const rsi = calcRSI(closes, rsiPeriod);
  const atr = calcATR(candles, atrPeriod);
  const volumeSpike = detectVolumeSpike(volumes, volumeLookback, volumeSpikeMultiplier);
  const trend = detectTrend(closes, emaFastPeriod, emaSlowPeriod);

  const lastRsi = rsi[rsi.length - 1] ?? 50;
  const lastAtr = atr[atr.length - 1] ?? 0;
  const lastFastEma = emaFast[emaFast.length - 1] ?? 0;
  const lastSlowEma = emaSlow[emaSlow.length - 1] ?? 0;

  const evidence: Record<string, unknown> = {
    rsi: Math.round(lastRsi * 100) / 100,
    atr: Math.round(lastAtr * 100) / 100,
    emaFast: Math.round(lastFastEma * 100) / 100,
    emaSlow: Math.round(lastSlowEma * 100) / 100,
    volumeSpike,
    trend,
    currentPrice,
  };

  let direction: "long" | "short" | null = null;

  if (trend === "up" && lastFastEma > lastSlowEma && volumeSpike) {
    direction = "long";
  } else if (trend === "down" && lastFastEma < lastSlowEma && volumeSpike) {
    direction = "short";
  }

  if (!direction) {
    return { signal: null, rejectReason: "No direction signal detected" };
  }

  const atrStop = lastAtr * 1.5;
  const invalidationPrice =
    direction === "long"
      ? Math.round((currentPrice - atrStop) * 100) / 100
      : Math.round((currentPrice + atrStop) * 100) / 100;

  const riskAmount = atrStop;
  const rewardAmount = riskAmount * minRiskReward;

  if (rewardAmount <= 0 || riskAmount <= 0) {
    return { signal: null, rejectReason: "Invalid risk/reward calculation" };
  }

  const tp1 =
    direction === "long"
      ? Math.round((currentPrice + rewardAmount) * 100) / 100
      : Math.round((currentPrice - rewardAmount) * 100) / 100;

  const entryLow = Math.round((currentPrice * 0.998) * 100) / 100;
  const entryHigh = Math.round((currentPrice * 1.002) * 100) / 100;

  const confidence = calculateConfidence(
    evidence,
    minRiskReward
  );

  const riskLevel = confidence >= 70 ? "high" : confidence >= 45 ? "medium" : "low";

  const signal: RawSignal = {
    assetId,
    strategyConfigId: config.id,
    signalType: "scalp",
    direction,
    timeframe: config.timeframe,
    entryLow: Math.min(entryLow, entryHigh),
    entryHigh: Math.max(entryLow, entryHigh),
    invalidationPrice,
    takeProfit1: tp1,
    riskLevel,
    confidence,
    reasonSummary: `Scalp ${direction} signal: EMA crossover + ${volumeSpike ? "volume spike + " : ""}RSI at ${Math.round(lastRsi)}`,
    evidence,
  };

  return { signal };
}

function calculateConfidence(
  evidence: Record<string, unknown>,
  minRiskReward: number
): number {
  let score = 0;

  const trend = evidence.trend as string;
  if (trend === "up" || trend === "down") score += 25;

  const rsi = evidence.rsi as number;
  if (rsi > 30 && rsi < 70) score += 20;

  if (evidence.volumeSpike) score += 15;

  const atrValue = evidence.atr as number;
  const price = evidence.currentPrice as number;
  if (atrValue / price < 0.05) score += 15;
  else if (atrValue / price < 0.1) score += 10;

  if (minRiskReward >= 2) score += 15;
  else if (minRiskReward >= 1.5) score += 10;
  else score += 5;

  return Math.min(100, score);
}
