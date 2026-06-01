import { Elysia } from "elysia";
import { TelegramProvider } from "@portfolio-agent/notifications";
import { getEnv } from "@portfolio-agent/shared";

export const notificationRoutes = new Elysia({ prefix: "/notifications" })
  .post("/telegram/test", async () => {
    const telegram = new TelegramProvider();
    if (!telegram.isConfigured()) {
      return { ok: false, error: "Telegram not configured" };
    }

    const env = getEnv();
    const result = await telegram.sendMessage({
      chatId: env.TELEGRAM_CHAT_ID,
      text: "Portfolio AI Agent - Test message. Telegram notifications working.",
    });

    return { ok: result.ok, error: result.error };
  })
  .get("/", () => ({ message: "Not implemented", status: 501 }));
