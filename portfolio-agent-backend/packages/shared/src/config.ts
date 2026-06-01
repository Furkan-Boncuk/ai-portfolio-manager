import { z } from "zod";

export const envSchema = z.object({
  DATABASE_URL: z.string().min(1),
  LOCAL_AUTH_TOKEN: z.string().min(1),
  CORS_ORIGIN: z.string().default("http://localhost:5173"),
  OLLAMA_BASE_URL: z.string().default("http://localhost:11434/api"),
  OLLAMA_CHAT_MODEL: z.string().default("qwen3:8b"),
  OLLAMA_EMBEDDING_MODEL: z.string().default("embeddinggemma"),
  TELEGRAM_BOT_TOKEN: z.string().default(""),
  TELEGRAM_CHAT_ID: z.string().default(""),
  BINANCE_PUBLIC_BASE_URL: z.string().default("https://api.binance.com"),
  MARKET_DATA_PROVIDER: z.string().default("binance"),
  WORKER_POLL_INTERVAL_MS: z
    .string()
    .default("30000")
    .transform((v) => parseInt(v, 10)),
  MAX_DAILY_SIGNALS: z
    .string()
    .default("20")
    .transform((v) => parseInt(v, 10)),
  SIGNAL_COOLDOWN_MINUTES: z
    .string()
    .default("30")
    .transform((v) => parseInt(v, 10)),
});

export type Env = z.infer<typeof envSchema>;

let cachedEnv: Env | null = null;

export function getEnv(): Env {
  if (cachedEnv) return cachedEnv;
  cachedEnv = envSchema.parse(process.env);
  return cachedEnv;
}
