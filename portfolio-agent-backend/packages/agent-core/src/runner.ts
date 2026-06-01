import { OllamaProvider } from "./providers/ollama";
import type { ChatMessage } from "./providers/types";

export class AgentRunner {
  private llm: OllamaProvider;

  constructor() {
    this.llm = new OllamaProvider();
  }

  async reviewSignal(signal: {
    asset: string;
    direction: string;
    timeframe: string;
    entryLow: string;
    entryHigh: string;
    invalidationPrice: string;
    takeProfit1: string;
    riskLevel: string;
    confidence: number;
    reasonSummary: string;
  }): Promise<string> {
    const available = await this.llm.isAvailable();
    if (!available) {
      return this.deterministicReview(signal);
    }

    const messages: ChatMessage[] = [
      {
        role: "system",
        content:
          "You are a financial signal reviewer. Provide a brief, clear analysis in Turkish. Include risk notes. Never say a trade is certain. Always include: 'Bu yatirim tavsiyesi degildir.'",
      },
      {
        role: "user",
        content: `Review this trading signal:\nAsset: ${signal.asset}\nDirection: ${signal.direction}\nTimeframe: ${signal.timeframe}\nEntry: ${signal.entryLow}-${signal.entryHigh}\nStop: ${signal.invalidationPrice}\nTP1: ${signal.takeProfit1}\nRisk: ${signal.riskLevel}\nConfidence: ${signal.confidence}/100\nReason: ${signal.reasonSummary}`,
      },
    ];

    try {
      const response = await this.llm.chat(messages);
      return response.content;
    } catch {
      return this.deterministicReview(signal);
    }
  }

  async chat(userMessage: string, context?: string): Promise<string> {
    const available = await this.llm.isAvailable();
    if (!available) {
      return "Ollama is not available. Please start Ollama or configure an LLM provider.";
    }

    const messages: ChatMessage[] = [
      {
        role: "system",
        content:
          `You are a portfolio AI assistant. Help with portfolio analysis, market questions, and signal explanations. Be concise. Never guarantee profits. Always include risk warnings. Answer in Turkish.\n${context ? `Context: ${context}` : ""}`,
      },
      { role: "user", content: userMessage },
    ];

    const response = await this.llm.chat(messages);
    return response.content;
  }

  private deterministicReview(signal: {
    asset: string;
    direction: string;
    timeframe: string;
    confidence: number;
    riskLevel: string;
  }): string {
    const directionTr = signal.direction === "long" ? "yukari" : "asagi";
    const confidenceDesc =
      signal.confidence >= 70 ? "yuksek" : signal.confidence >= 45 ? "orta" : "dusuk";

    return [
      `${signal.asset} icin ${signal.timeframe} ${directionTr} yonlu sinyal.`,
      `Guven skoru: ${confidenceDesc} (${signal.confidence}/100).`,
      `Risk seviyesi: ${signal.riskLevel}.`,
      "Stop seviyesine dikkat edin ve risk yonetimi uygulayin.",
      "Bu yatirim tavsiyesi degildir.",
    ].join("\n");
  }
}
