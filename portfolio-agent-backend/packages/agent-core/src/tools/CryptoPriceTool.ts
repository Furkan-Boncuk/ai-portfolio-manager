import { z } from "zod";
import { getEnv } from "@portfolio-agent/shared";
import type { Tool } from "./types";

function normalizeSymbol(v: unknown): string[] {
  if (Array.isArray(v)) return v.flatMap((x) => normalizeSymbol(x));
  if (typeof v === "string") {
    const parts = v.split(/[,;:\s]+/).map((s) => s.trim()).filter(Boolean);
    return parts.length > 0 ? parts : ["BTC"];
  }
  return [];
}

export const cryptoPriceInputSchema = z.object({
  symbol: z.preprocess(normalizeSymbol, z.array(z.string().min(1)).min(1)),
  currency: z.string().default("USDT"),
}).transform((data) => ({
  symbols: data.symbol,
  currency: data.currency || "USDT",
}));

export class CryptoPriceTool implements Tool {
  get definition() {
    return {
      type: "function" as const,
      function: {
        name: "market.cryptoPrice",
        description:
          "Get current real-time cryptocurrency prices from Binance. Pass one or multiple symbols. Use this for accurate price lookups instead of web search.",
        parameters: {
          type: "object",
          properties: {
            symbol: {
              type: "string",
              description:
                "One or more cryptocurrency symbols separated by commas or spaces (e.g. 'BTC', 'ETH,SOL', 'BTC ETH SOL'). Default: BTC",
            },
            currency: {
              type: "string",
              description:
                "Quote currency (e.g. USDT, BUSD, TRY, EUR). Default: USDT",
            },
          },
        },
      },
    };
  }

  async execute(input: Record<string, unknown>): Promise<string> {
    const parsed = cryptoPriceInputSchema.safeParse(input);
    if (!parsed.success) {
      return `Error: Invalid input - ${parsed.error.message}`;
    }

    const { symbols, currency } = parsed.data;
    const results: string[] = [];

    for (const sym of symbols) {
      const pair = `${sym.toUpperCase()}${currency.toUpperCase()}`;
      try {
        const env = getEnv();
        const res = await fetch(
          `${env.BINANCE_PUBLIC_BASE_URL}/api/v3/ticker/price?symbol=${encodeURIComponent(pair)}`,
          { signal: AbortSignal.timeout(5000) },
        );
        if (res.ok) {
          const data = (await res.json()) as { symbol: string; price: string };
          results.push(`${sym.toUpperCase()} = ${data.price}`);
        } else {
          results.push(`${sym.toUpperCase()}: not found`);
        }
      } catch {
        results.push(`${sym.toUpperCase()}: fetch error`);
      }
    }

    return results.join("\n");
  }
}
