import { OllamaProvider } from "./providers/OllamaProvider";
import type { ChatMessage, ToolCall } from "./providers/types";
import type { Tool } from "./tools/types";

const DEFAULT_SYSTEM_PROMPT = "You are a portfolio AI assistant with tools. For price queries (BTC, ETH, etc.), use market.cryptoPrice — it gives accurate real-time data from Binance. For news or general info, use research.webSearch. Actually call the tool, do not just say you will. Answer in Turkish. Be concise.";

export class AgentRunner {
  private llm: OllamaProvider;
  private tools: Tool[];
  private systemPrompt: string;

  constructor(tools?: Tool[], systemPrompt?: string) {
    this.llm = new OllamaProvider();
    this.tools = tools ?? [];
    this.systemPrompt = systemPrompt ?? DEFAULT_SYSTEM_PROMPT;
  }

  private get toolDefinitions() {
    return this.tools.map((t) => t.definition);
  }

  private async executeTool(toolCall: ToolCall): Promise<string> {
    const tool = this.tools.find((t) => t.definition.function.name === toolCall.function.name);
    if (!tool) {
      return `Error: Unknown tool "${toolCall.function.name}"`;
    }

    let args: Record<string, unknown>;
    try {
      args = JSON.parse(toolCall.function.arguments) as Record<string, unknown>;
    } catch {
      return `Error: Invalid arguments JSON for tool "${toolCall.function.name}"`;
    }

    const result = await tool.execute(args);
    return result;
  }

  async chat(
    userMessage: string,
    history?: ChatMessage[],
    context?: string,
  ): Promise<string> {
    const available = await this.llm.isAvailable();
    if (!available) {
      return "Ollama is not available. Please start Ollama or configure an LLM provider.";
    }

    const systemContent = context
      ? `${this.systemPrompt}\n\nContext: ${context}`
      : this.systemPrompt;

    const messages: ChatMessage[] = [
      { role: "system", content: systemContent },
      ...(history ?? []),
      { role: "user", content: userMessage },
    ];

    const tools = this.toolDefinitions;
    let turns = 0;
    const MAX_TOOL_TURNS = 5;

    while (turns < MAX_TOOL_TURNS) {
      let response: Awaited<ReturnType<typeof this.llm.chat>>;

      try {
        response = await this.llm.chat(messages, tools);
      } catch {
        if (turns === 0) {
          try {
            const res = await this.llm.chat(messages);
            return res.content;
          } catch {
            return "I could not reach the AI model. The model might still be loading or is too slow to respond. Please try again in a moment with a simpler question.";
          }
        }
        break;
      }

      turns++;

      if (!response.tool_calls || response.tool_calls.length === 0) {
        return response.content;
      }

      messages.push({
        role: "assistant",
        content: response.content || "",
        tool_calls: response.tool_calls,
      });

      for (const toolCall of response.tool_calls) {
        const result = await this.executeTool(toolCall);

        messages.push({
          role: "tool",
          content: result,
          tool_call_id: toolCall.id,
          name: toolCall.function.name,
        });
      }
    }

    try {
      const final = await this.llm.chat(messages, tools);
      return final.content;
    } catch {
      const res = await this.llm.chat(messages);
      return res.content;
    }
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
