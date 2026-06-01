import { getEnv } from "@portfolio-agent/shared";

export interface TelegramMessage {
  chatId: string;
  text: string;
  parseMode?: "HTML" | "Markdown";
}

export class TelegramProvider {
  private botToken: string;
  private baseUrl: string;

  constructor() {
    const env = getEnv();
    this.botToken = env.TELEGRAM_BOT_TOKEN;
    this.baseUrl = "https://api.telegram.org";
  }

  isConfigured(): boolean {
    return this.botToken.length > 0;
  }

  async sendMessage(message: TelegramMessage): Promise<{ ok: boolean; error?: string }> {
    if (!this.isConfigured()) {
      return { ok: false, error: "Telegram bot token not configured" };
    }

    try {
      const url = `${this.baseUrl}/bot${this.botToken}/sendMessage`;
      const body: Record<string, string> = {
        chat_id: message.chatId,
        text: message.text,
        disable_web_page_preview: "true",
      };

      if (message.parseMode) {
        body.parse_mode = message.parseMode;
      }

      const response = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        const errData = await response.json();
        return {
          ok: false,
          error: `Telegram API error: ${(errData as { description?: string }).description ?? response.statusText}`,
        };
      }

      return { ok: true };
    } catch (err) {
      return { ok: false, error: (err as Error).message };
    }
  }

  formatSignalMessage(signal: {
    signalType: string;
    direction: string;
    timeframe: string;
    entryLow: string;
    entryHigh: string;
    invalidationPrice: string;
    takeProfit1: string;
    takeProfit2?: string;
    riskLevel: string;
    confidence: number;
    reasonSummary: string;
    symbol?: string;
  }): string {
    const lines: string[] = [];
    const dirEmoji = signal.direction === "long" ? "\u{1F4C8}" : "\u{1F4C9}";

    lines.push(`${dirEmoji} *${signal.signalType.toUpperCase()} SIGNAL*`);
    lines.push("");
    if (signal.symbol) lines.push(`*Asset:* ${signal.symbol}`);
    lines.push(`*Direction:* ${signal.direction.toUpperCase()}`);
    lines.push(`*Timeframe:* ${signal.timeframe}`);
    lines.push(`*Entry Zone:* ${signal.entryLow} - ${signal.entryHigh}`);
    lines.push(`*Stop/Invalidation:* ${signal.invalidationPrice}`);
    lines.push(`*Take Profit 1:* ${signal.takeProfit1}`);
    if (signal.takeProfit2) lines.push(`*Take Profit 2:* ${signal.takeProfit2}`);
    lines.push(`*Risk Level:* ${signal.riskLevel.toUpperCase()}`);
    lines.push(`*Confidence:* ${signal.confidence}/100`);
    lines.push(`*Reason:* ${signal.reasonSummary}`);
    lines.push("");
    lines.push("_Bu yatirim tavsiyesi degildir._");

    return lines.join("\n");
  }
}
