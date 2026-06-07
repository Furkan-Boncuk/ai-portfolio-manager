export interface TelegramMessage {
  chatId: string;
  text: string;
  parseMode?: "HTML" | "Markdown";
}
