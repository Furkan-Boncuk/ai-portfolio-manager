import { getEnv, candleSchema, ExternalProviderError, RateLimitError } from "@portfolio-agent/shared";
import type { MarketDataProvider } from "./types";
import type { Candle, CandleRequest, Ticker } from "@portfolio-agent/shared";

export class BinanceProvider implements MarketDataProvider {
  readonly name = "binance";
  private baseUrl: string;

  constructor() {
    this.baseUrl = getEnv().BINANCE_PUBLIC_BASE_URL;
  }

  async getCandles(request: CandleRequest): Promise<Candle[]> {
    const { symbol, timeframe, limit = 100 } = request;
    const url = `${this.baseUrl}/api/v3/klines?symbol=${symbol}&interval=${timeframe}&limit=${limit}`;

    const response = await fetch(url);

    if (response.status === 429) {
      throw new RateLimitError("Binance rate limit exceeded");
    }

    if (!response.ok) {
      throw new ExternalProviderError(
        `Binance API error: ${response.statusText}`,
        "binance",
        { status: response.status }
      );
    }

    const raw = (await response.json()) as (string | number)[][];

    return raw.map((kline) => ({
      openTime: kline[0] ?? 0,
      closeTime: kline[6] ?? 0,
      open: kline[1] ?? "0",
      high: kline[2] ?? "0",
      low: kline[3] ?? "0",
      close: kline[4] ?? "0",
      volume: kline[5] ?? "0",
    })).map((c) => {
      const result = candleSchema.safeParse({
        assetId: "",
        provider: "binance",
        timeframe,
        openTime: new Date(c.openTime).toISOString(),
        closeTime: new Date(c.closeTime).toISOString(),
        open: parseFloat(String(c.open)),
        high: parseFloat(String(c.high)),
        low: parseFloat(String(c.low)),
        close: parseFloat(String(c.close)),
        volume: parseFloat(String(c.volume)),
        isClosed: true,
      });
      if (!result.success) {
        throw new ExternalProviderError("Failed to parse candle", "binance");
      }
      return result.data;
    });
  }

  async getTicker(symbol: string): Promise<Ticker> {
    const url = `${this.baseUrl}/api/v3/ticker/24hr?symbol=${symbol}`;
    const response = await fetch(url);

    if (!response.ok) {
      throw new ExternalProviderError(
        `Binance ticker error: ${response.statusText}`,
        "binance"
      );
    }

    const data = (await response.json()) as { lastPrice: string; priceChangePercent: string; volume: string };
    return {
      symbol,
      price: parseFloat(data.lastPrice),
      change24h: parseFloat(data.priceChangePercent),
      volume24h: parseFloat(data.volume),
    };
  }
}
