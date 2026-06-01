import { calcEMA, calcRSI, calcMACD, calcATR, detectTrend } from "../indicators";
import type { CandleData } from "../indicators";
import type { RawSignal, StrategyConfig, StrategyResult } from "../types";

export function evaluateSwing(
  candles: CandleData[],
  config: StrategyConfig,
  assetId: string,
  currentPrice: number
): StrategyResult {
  const params = config.params;
  const emaTrendPeriod = params.emaTrend ?? 50;
  const macdFast = params.macdFast ?? 12;
  const macdSlow = params.macdSlow ?? 26;
  const macdSignalP = params.macdSignal ?? 9;
  const rsiMin = params.rsiMin ?? 45;
  const rsiMax = params.rsiMax ?? 65;
  const atrPeriod = params.atrPeriod ?? 14;
  const minRiskReward = params.minRiskReward ?? 2.0;

  const closes = candles.map((c) => c.close);

  if (closes.length < emaTrendPeriod + 1) {
    return { signal: null, rejectReason: "Insufficient candle data for swing" };
  }

  const emaTrend = calcEMA(closes, emaTrendPeriod);
  const rsi = calcRSI(closes, 14);
  const { macd, signal: signalLine } = calcMACD(closes, macdFast, macdSlow, macdSignalP);
  const atr = calcATR(candles, atrPeriod);
  const trend = detectTrend(closes, 9, emaTrendPeriod);

  const lastPrice = closes[closes.length - 1] ?? currentPrice;
  const lastEmaTrend = emaTrend[emaTrend.length - 1] ?? 0;
  const lastRsi = rsi[rsi.length - 1] ?? 50;
  const lastMacd = macd[macd.length - 1] ?? 0;
  const lastSignal = signalLine[signalLine.length - 1] ?? 0;
  const lastAtr = atr[atr.length - 1] ?? 0;

  const evidence: Record<string, unknown> = {
    price: lastPrice,
    emaTrend: Math.round(lastEmaTrend * 100) / 100,
    rsi: Math.round(lastRsi * 100) / 100,
    macd: Math.round(lastMacd * 100) / 100,
    signalLine: Math.round(lastSignal * 100) / 100,
    atr: Math.round(lastAtr * 100) / 100,
    trend,
    currentPrice,
  };

  let direction: "long" | "short" | null = null;

  const macdBullish = lastMacd > lastSignal;
  const priceAboveEma = lastPrice > lastEmaTrend;
  const rsiInRange = lastRsi >= rsiMin && lastRsi <= rsiMax;

  if (trend === "up" && priceAboveEma && macdBullish && rsiInRange) {
    direction = "long";
  } else if (trend === "down" && !priceAboveEma && !macdBullish && rsiInRange) {
    direction = "short";
  }

  if (!direction) {
    return { signal: null, rejectReason: "No swing direction signal" };
  }

  const atrStop = lastAtr * 2;
  const invalidationPrice =
    direction === "long"
      ? Math.round((lastPrice - atrStop) * 100) / 100
      : Math.round((lastPrice + atrStop) * 100) / 100;

  const riskAmount = atrStop;
  const rewardAmount = riskAmount * minRiskReward;

  const tp1 =
    direction === "long"
      ? Math.round((lastPrice + rewardAmount) * 100) / 100
      : Math.round((lastPrice - rewardAmount) * 100) / 100;

  const tp2 =
    direction === "long"
      ? Math.round((lastPrice + rewardAmount * 1.5) * 100) / 100
      : Math.round((lastPrice - rewardAmount * 1.5) * 100) / 100;

  const entryLow = Math.round((lastPrice * 0.995) * 100) / 100;
  const entryHigh = Math.round((lastPrice * 1.005) * 100) / 100;

  let score = 0;
  if (trend === "up" || trend === "down") score += 25;
  if (macdBullish || !macdBullish) score += 20;
  if (rsiInRange) score += 15;
  if (lastAtr / lastPrice < 0.05) score += 15;
  if (minRiskReward >= 2) score += 15;
  const confidence = Math.min(100, score);

  const riskLevel = confidence >= 70 ? "high" : confidence >= 45 ? "medium" : "low";

  const signal: RawSignal = {
    assetId,
    strategyConfigId: config.id,
    signalType: "swing",
    direction,
    timeframe: config.timeframe,
    entryLow: Math.min(entryLow, entryHigh),
    entryHigh: Math.max(entryLow, entryHigh),
    invalidationPrice,
    takeProfit1: tp1,
    takeProfit2: tp2,
    riskLevel,
    confidence,
    reasonSummary: `Swing ${direction} signal: Trend ${trend}, MACD ${macdBullish ? "bullish" : "bearish"}, RSI ${Math.round(lastRsi)}`,
    evidence,
  };

  return { signal };
}
