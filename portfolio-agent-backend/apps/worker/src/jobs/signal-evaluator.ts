import { getDb } from "@portfolio-agent/db";
import { watchlistAssets, assets, strategyConfigs, signals } from "@portfolio-agent/db/schema";
import { eq, and } from "drizzle-orm";
import { getCandlesForSignal } from "@portfolio-agent/db/repositories/candles";
import { evaluateScalp, evaluateSwing, type StrategyConfig, type CandleData } from "@portfolio-agent/signal-engine";
import { createSSEEvent, type SSEEvent, getEnv } from "@portfolio-agent/shared";
import { TelegramProvider } from "@portfolio-agent/notifications";

export async function runSignalEvaluator(
  onEvent: (event: SSEEvent) => void
): Promise<void> {
  const db = getDb();

  const activeStrategies = await db
    .select({
      strategy: strategyConfigs,
      assetId: watchlistAssets.assetId,
      symbol: assets.providerSymbol,
    })
    .from(strategyConfigs)
    .innerJoin(watchlistAssets, eq(watchlistAssets.strategyType, strategyConfigs.strategyType))
    .innerJoin(assets, eq(assets.id, watchlistAssets.assetId))
    .where(eq(strategyConfigs.isActive, true));

  for (const { strategy, assetId, symbol } of activeStrategies) {
    const candles = await getCandlesForSignal(assetId, strategy.timeframe, 100);

    if (candles.length < 50) continue;

    const candleData: CandleData[] = candles
      .reverse()
      .map((c) => ({
        close: parseFloat(String(c.close)),
        high: parseFloat(String(c.high)),
        low: parseFloat(String(c.low)),
        volume: parseFloat(String(c.volume)),
      }));

    const currentPrice = parseFloat(String(candles[0]?.close ?? "0"));

    const config: StrategyConfig = {
      id: strategy.id,
      name: strategy.name,
      strategyType: strategy.strategyType as "scalp" | "swing",
      timeframe: strategy.timeframe,
      params: (strategy.params as Record<string, number>) ?? {},
      maxSignalsPerDay: strategy.maxSignalsPerDay ?? 20,
      cooldownMinutes: strategy.cooldownMinutes ?? 60,
    };

    const result =
      config.strategyType === "scalp"
        ? evaluateScalp(candleData, config, assetId, currentPrice)
        : evaluateSwing(candleData, config, assetId, currentPrice);

    if (result.signal) {
      try {
        await db.insert(signals).values({
          userId: strategy.userId,
          assetId: result.signal.assetId,
          strategyConfigId: strategy.id,
          signalType: result.signal.signalType,
          direction: result.signal.direction,
          timeframe: result.signal.timeframe,
          entryLow: String(result.signal.entryLow),
          entryHigh: String(result.signal.entryHigh),
          invalidationPrice: String(result.signal.invalidationPrice),
          takeProfit1: String(result.signal.takeProfit1),
          takeProfit2: result.signal.takeProfit2
            ? String(result.signal.takeProfit2)
            : undefined,
          riskLevel: result.signal.riskLevel,
          confidence: result.signal.confidence,
          reasonSummary: result.signal.reasonSummary,
          evidence: result.signal.evidence,
          disclaimer: "Bu yatirim tavsiyesi degildir.",
        });

        const telegram = new TelegramProvider();
        if (telegram.isConfigured()) {
          const env = getEnv();
          const message = telegram.formatSignalMessage({
            signalType: result.signal.signalType,
            direction: result.signal.direction,
            timeframe: result.signal.timeframe,
            entryLow: String(result.signal.entryLow),
            entryHigh: String(result.signal.entryHigh),
            invalidationPrice: String(result.signal.invalidationPrice),
            takeProfit1: String(result.signal.takeProfit1),
            takeProfit2: result.signal.takeProfit2 ? String(result.signal.takeProfit2) : undefined,
            riskLevel: result.signal.riskLevel,
            confidence: result.signal.confidence,
            reasonSummary: result.signal.reasonSummary,
            symbol: symbol ?? undefined,
          });

          const result2 = await telegram.sendMessage({
            chatId: env.TELEGRAM_CHAT_ID,
            text: message,
            parseMode: "Markdown",
          });

          onEvent(
            createSSEEvent(
              result2.ok ? "notification.telegram.sent" : "notification.telegram.failed",
              { symbol, ok: result2.ok, error: result2.error },
              "worker"
            )
          );
        }

        onEvent(
          createSSEEvent(
            "signal.created",
            {
              assetId: result.signal.assetId,
              symbol,
              signalType: result.signal.signalType,
              direction: result.signal.direction,
              timeframe: result.signal.timeframe,
              confidence: result.signal.confidence,
            },
            "worker"
          )
        );
      } catch (err) {
        console.error(
          `[signal-evaluator] error saving signal for ${symbol}:`,
          (err as Error).message
        );
      }
    } else if (result.rejectReason) {
      onEvent(
        createSSEEvent(
          "signal.rejected",
          {
            assetId,
            symbol,
            reason: result.rejectReason,
            strategyType: strategy.strategyType,
          },
          "worker"
        )
      );
    }
  }
}
