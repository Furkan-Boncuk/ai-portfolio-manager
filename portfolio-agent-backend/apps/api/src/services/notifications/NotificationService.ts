import type { TelegramProvider } from "@portfolio-agent/notifications";
import { getEnv } from "@portfolio-agent/shared";

export class NotificationService {
  constructor(private readonly telegram: TelegramProvider) {}

  async sendTelegramTest(): Promise<{ ok: boolean; error?: string }> {
    if (!this.telegram.isConfigured()) {
      return { ok: false, error: "Telegram not configured" };
    }

    return this.telegram.sendMessage({
      chatId: getEnv().TELEGRAM_CHAT_ID,
      text: "Portfolio AI Agent - Test message. Telegram notifications working.",
    });
  }
}
