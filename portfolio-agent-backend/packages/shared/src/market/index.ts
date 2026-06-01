import { z } from "zod";

export const timeframeEnum = z.enum(["1m", "5m", "15m", "30m", "1h", "4h", "1d", "1w"]);
export type Timeframe = z.infer<typeof timeframeEnum>;

export const candleSchema = z.object({
  assetId: z.string().uuid(),
  provider: z.string(),
  timeframe: timeframeEnum,
  openTime: z.string().datetime(),
  closeTime: z.string().datetime().optional(),
  open: z.number(),
  high: z.number(),
  low: z.number(),
  close: z.number(),
  volume: z.number(),
  isClosed: z.boolean().default(true),
});

export type Candle = z.infer<typeof candleSchema>;

export const tickerSchema = z.object({
  symbol: z.string(),
  price: z.number(),
  change24h: z.number().optional(),
  volume24h: z.number().optional(),
});

export type Ticker = z.infer<typeof tickerSchema>;

export const candleRequestSchema = z.object({
  symbol: z.string(),
  timeframe: timeframeEnum,
  limit: z.number().int().positive().max(1000).default(100),
  startTime: z.string().datetime().optional(),
  endTime: z.string().datetime().optional(),
});

export type CandleRequest = z.infer<typeof candleRequestSchema>;
