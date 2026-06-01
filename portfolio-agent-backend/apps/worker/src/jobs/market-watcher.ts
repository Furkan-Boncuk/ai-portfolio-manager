import { getDb } from "@portfolio-agent/db";
import { watchlists, watchlistAssets, assets } from "@portfolio-agent/db/schema";
import { eq, and } from "drizzle-orm";
import { MockMarketProvider, BinanceProvider } from "@portfolio-agent/market-data";
import { type MarketDataProvider } from "@portfolio-agent/market-data";
import { upsertCandles } from "@portfolio-agent/db/repositories/candles";
import { createSSEEvent, type SSEEvent } from "@portfolio-agent/shared";

let provider: MarketDataProvider;

function getProvider(): MarketDataProvider {
  if (!provider) {
    const providerName = process.env.MARKET_DATA_PROVIDER ?? "mock";
    provider = providerName === "binance" ? new BinanceProvider() : new MockMarketProvider();
  }
  return provider;
}

export async function runMarketWatcher(
  onEvent: (event: SSEEvent) => void
): Promise<void> {
  const db = getDb();
  const marketProvider = getProvider();

  const activeWatchlists = await db
    .select()
    .from(watchlists)
    .where(eq(watchlists.isActive, true));

  for (const watchlist of activeWatchlists) {
    const wlAssets = await db
      .select({
        assetId: watchlistAssets.assetId,
        timeframe: watchlistAssets.timeframe,
        symbol: assets.providerSymbol,
      })
      .from(watchlistAssets)
      .innerJoin(assets, eq(assets.id, watchlistAssets.assetId))
      .where(
        and(
          eq(watchlistAssets.watchlistId, watchlist.id),
          eq(watchlistAssets.isActive, true)
        )
      );

    for (const wa of wlAssets) {
      if (!wa.symbol || !wa.timeframe) continue;

      try {
        const candles = await marketProvider.getCandles({
          symbol: wa.symbol,
          timeframe: wa.timeframe as "1m" | "5m" | "15m" | "30m" | "1h" | "4h" | "1d" | "1w",
          limit: 100,
        });

        const enriched = candles.map((c) => ({
          ...c,
          assetId: wa.assetId,
        }));

        await upsertCandles(enriched);

        const lastClosed = enriched.find((c) => c.isClosed);
        if (lastClosed) {
          onEvent(
            createSSEEvent(
              "market.candle.closed",
              {
                assetId: wa.assetId,
                symbol: wa.symbol,
                timeframe: wa.timeframe,
                close: lastClosed.close,
                closeTime: lastClosed.closeTime,
              },
              "worker"
            )
          );
        }
      } catch (err) {
        console.error(
          `[market-watcher] error for ${wa.symbol} ${wa.timeframe}:`,
          (err as Error).message
        );
      }
    }
  }
}
