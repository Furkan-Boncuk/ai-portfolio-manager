import type { MarketDataProvider } from "./types";
import type { Candle, CandleRequest, Ticker } from "@portfolio-agent/shared";

export class MockMarketProvider implements MarketDataProvider {
  readonly name = "mock";
  private basePrice: number;

  constructor(basePrice = 65000) {
    this.basePrice = basePrice;
  }

  async getCandles(request: CandleRequest): Promise<Candle[]> {
    const { limit = 100 } = request;
    const candles: Candle[] = [];
    let price = this.basePrice;

    for (let i = limit; i > 0; i--) {
      const volatility = price * 0.02;
      const change = (Math.random() - 0.5) * volatility;
      const open = price;
      const close = open + change;
      const high = Math.max(open, close) + Math.random() * volatility * 0.5;
      const low = Math.min(open, close) - Math.random() * volatility * 0.5;

      candles.push({
        assetId: request.symbol,
        provider: "mock",
        timeframe: request.timeframe,
        openTime: new Date(Date.now() - i * 60 * 1000).toISOString(),
        closeTime: new Date(Date.now() - (i - 1) * 60 * 1000).toISOString(),
        open: Math.round(open * 100) / 100,
        high: Math.round(high * 100) / 100,
        low: Math.round(low * 100) / 100,
        close: Math.round(close * 100) / 100,
        volume: Math.round(Math.random() * 1000 * 100) / 100,
        isClosed: true,
      });

      price = close;
    }

    return candles;
  }

  async getTicker(symbol: string): Promise<Ticker> {
    const price = this.basePrice + (Math.random() - 0.5) * this.basePrice * 0.05;
    return {
      symbol,
      price: Math.round(price * 100) / 100,
      change24h: Math.round((Math.random() - 0.5) * 10 * 100) / 100,
      volume24h: Math.round(Math.random() * 1000000),
    };
  }
}
