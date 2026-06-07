import type { CandleData } from "./indicators.types";

export { type CandleData };

export function calcEMA(data: number[], period: number): number[] {
  if (data.length < period) return new Array(data.length).fill(0);
  const k = 2 / (period + 1);
  const result: number[] = [];
  let ema = data.slice(0, period).reduce((a, b) => a + b, 0) / period;
  for (let i = 0; i < period; i++) result.push(0);
  result[period - 1] = ema;
  for (let i = period; i < data.length; i++) {
    ema = (data[i]! - ema) * k + ema;
    result.push(ema);
  }
  return result;
}

export function calcRSI(closes: number[], period = 14): number[] {
  if (closes.length < period + 1) return new Array(closes.length).fill(50);
  const result: number[] = new Array(closes.length).fill(50);
  const gains: number[] = [];
  const losses: number[] = [];
  for (let i = 1; i < closes.length; i++) {
    const diff = closes[i]! - closes[i - 1]!;
    gains.push(diff > 0 ? diff : 0);
    losses.push(diff < 0 ? -diff : 0);
  }
  let avgGain = gains.slice(0, period).reduce((a, b) => a + b, 0) / period;
  let avgLoss = losses.slice(0, period).reduce((a, b) => a + b, 0) / period;
  result[period] = avgLoss === 0 ? 100 : 100 - 100 / (1 + avgGain / avgLoss);
  for (let i = period; i < gains.length; i++) {
    avgGain = (avgGain * (period - 1) + gains[i]!) / period;
    avgLoss = (avgLoss * (period - 1) + losses[i]!) / period;
    result[i + 1] = avgLoss === 0 ? 100 : 100 - 100 / (1 + avgGain / avgLoss);
  }
  return result;
}

export function calcMACD(
  closes: number[],
  fast = 12,
  slow = 26,
  signal = 9
): { macd: number[]; signal: number[]; histogram: number[] } {
  const emaFast = calcEMA(closes, fast);
  const emaSlow = calcEMA(closes, slow);
  const macd: number[] = [];
  for (let i = 0; i < closes.length; i++) {
    macd.push(emaFast[i]! - emaSlow[i]!);
  }
  const signalLine = calcEMA(macd, signal);
  const histogram = macd.map((v, i) => v - signalLine[i]!);
  return { macd, signal: signalLine, histogram };
}

export function calcATR(candles: CandleData[], period = 14): number[] {
  if (candles.length < 2) return [0];
  const tr: number[] = [];
  for (let i = 1; i < candles.length; i++) {
    const curr = candles[i]!;
    const prev = candles[i - 1]!;
    const h_l = curr.high - curr.low;
    const h_pc = Math.abs(curr.high - prev.close);
    const l_pc = Math.abs(curr.low - prev.close);
    tr.push(Math.max(h_l, h_pc, l_pc));
  }
  const atr: number[] = new Array(candles.length).fill(0);
  atr[period] = tr.slice(0, period).reduce((a, b) => a + b, 0) / period;
  for (let i = period; i < tr.length; i++) {
    atr[i + 1] = (atr[i]! * (period - 1) + tr[i]!) / period;
  }
  return atr;
}

export function detectVolumeSpike(
  volumes: number[],
  lookback = 20,
  multiplier = 1.5
): boolean {
  if (volumes.length < lookback + 1) return false;
  const recent = volumes.slice(-1)[0]!;
  const avg = volumes.slice(-lookback - 1, -1).reduce((a, b) => a + b, 0) / lookback;
  return recent > avg * multiplier;
}

export function detectTrend(closes: number[], shortPeriod = 9, longPeriod = 21): "up" | "down" | "neutral" {
  const shortEMA = calcEMA(closes, shortPeriod);
  const longEMA = calcEMA(closes, longPeriod);
  const lastShort = shortEMA[shortEMA.length - 1];
  const lastLong = longEMA[longEMA.length - 1];
  if (lastShort && lastLong) {
    if (lastShort > lastLong) return "up";
    if (lastShort < lastLong) return "down";
  }
  return "neutral";
}
