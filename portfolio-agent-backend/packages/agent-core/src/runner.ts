import { ChatRole } from "apps/api/src/services/chat/ChatService.types";
import { OllamaProvider } from "./providers/ollama";
import type { ChatMessage, ToolCall } from "./providers/types";
import type { Tool } from "./tools/types";

export class AgentRunner {
  private llm: OllamaProvider;
  private tools: Tool[];

  constructor(tools?: Tool[]) {
    this.llm = new OllamaProvider();
    this.tools = tools ?? [];
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

    return tool.execute(args);
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

    const messages: ChatMessage[] = [
      {
        role: "system",
        content:
          `You are a portfolio AI assistant. Help with portfolio analysis, market questions, and signal explanations. Be very concise (max 3 sentences). Never guarantee profits. Always include risk warnings. Answer in Turkish.\n${context ? `Context: ${context}` : ""}`,
      },
      ...(history ?? []),
      { role: "user", content: userMessage },
    ];

    const tools = this.toolDefinitions;
    let turns = 0;
    const MAX_TOOL_TURNS = 5;

    while (turns < MAX_TOOL_TURNS) {
      const response = await this.llm.chat(messages, tools);
      turns++;

      if (!response.tool_calls || response.tool_calls.length === 0) {
        return response.content;
      }

      messages.push({
        role: ChatRole.Assistant,
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

    const final = await this.llm.chat(messages, tools);
    return final.content;
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
