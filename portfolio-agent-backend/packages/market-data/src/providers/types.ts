import type { Candle, CandleRequest, Ticker } from "@portfolio-agent/shared";

export interface MarketDataProvider {
  readonly name: string;
  getCandles(request: CandleRequest): Promise<Candle[]>;
  getTicker(symbol: string): Promise<Ticker>;
}

export interface AssetInfo {
  symbol: string;
  name: string;
  quoteCurrency: string;
  providerSymbol: string;
}
