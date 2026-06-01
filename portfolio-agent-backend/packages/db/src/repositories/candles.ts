import { eq, and, desc, sql } from "drizzle-orm";
import { getDb } from "..";
import { marketCandles } from "../schema";
import type { Candle } from "@portfolio-agent/shared";

export async function upsertCandles(candles: Candle[]): Promise<void> {
  const db = getDb();

  for (const candle of candles) {
    await db
      .insert(marketCandles)
      .values({
        assetId: candle.assetId,
        provider: candle.provider,
        timeframe: candle.timeframe,
        openTime: new Date(candle.openTime),
        closeTime: candle.closeTime ? new Date(candle.closeTime) : undefined,
        open: String(candle.open),
        high: String(candle.high),
        low: String(candle.low),
        close: String(candle.close),
        volume: String(candle.volume),
        isClosed: candle.isClosed,
      })
      .onConflictDoUpdate({
        target: [
          marketCandles.assetId,
          marketCandles.provider,
          marketCandles.timeframe,
          marketCandles.openTime,
        ],
        set: {
          close: String(candle.close),
          high: sql`GREATEST(${marketCandles.high}, ${String(candle.high)})`,
          low: sql`LEAST(${marketCandles.low}, ${String(candle.low)})`,
          volume: String(candle.volume),
          isClosed: candle.isClosed,
          closeTime: candle.closeTime ? new Date(candle.closeTime) : undefined,
        },
      });
  }
}

export async function getLatestClosedCandle(
  assetId: string,
  timeframe: string
): Promise<typeof marketCandles.$inferSelect | undefined> {
  const db = getDb();
  const results = await db
    .select()
    .from(marketCandles)
    .where(
      and(
        eq(marketCandles.assetId, assetId),
        eq(marketCandles.timeframe, timeframe),
        eq(marketCandles.isClosed, true)
      )
    )
    .orderBy(desc(marketCandles.openTime))
    .limit(1);

  return results[0];
}

export async function getCandlesForSignal(
  assetId: string,
  timeframe: string,
  limit = 100
): Promise<typeof marketCandles.$inferSelect[]> {
  const db = getDb();
  return db
    .select()
    .from(marketCandles)
    .where(
      and(
        eq(marketCandles.assetId, assetId),
        eq(marketCandles.timeframe, timeframe)
      )
    )
    .orderBy(desc(marketCandles.openTime))
    .limit(limit);
}
