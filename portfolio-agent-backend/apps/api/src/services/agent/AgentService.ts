import type { AgentRunner } from "@portfolio-agent/agent-core";

export class AgentService {
  constructor(private readonly runner: AgentRunner) {}

  async chat(
    message: string,
    context?: string,
  ): Promise<{ response: string }> {
    const response = await this.runner.chat(message, context);
    return { response };
  }

  async reviewSignal(data: {
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
  }): Promise<{ response: string }> {
    const response = await this.runner.reviewSignal(data);
    return { response };
  }
}
