import { eq } from "drizzle-orm";
import type { Db } from "@portfolio-agent/db";
import { getEnv } from "@portfolio-agent/shared";
import { userPreferences } from "@portfolio-agent/db/schema";
import type { ModelPreferences, OllamaModelTag } from "./SettingsService.types";

export class SettingsService {
  constructor(private db: Db) {}

  async getModelPreferences(userId: string): Promise<ModelPreferences> {
    const [row] = await this.db
      .select()
      .from(userPreferences)
      .where(eq(userPreferences.userId, userId))
      .limit(1);

    const prefs = row?.preferences as Record<string, unknown> | undefined;
    const env = getEnv();

    return {
      fastModel: (prefs?.fastModel as string) ?? env.OLLAMA_FAST_MODEL,
      thinkingModel: (prefs?.thinkingModel as string) ?? env.OLLAMA_THINKING_MODEL,
    };
  }

  async updateModelPreferences(
    userId: string,
    prefs: ModelPreferences,
  ): Promise<ModelPreferences> {
    const env = getEnv();
    const stored: Record<string, unknown> = {};

    if (prefs.fastModel && prefs.fastModel !== env.OLLAMA_FAST_MODEL) {
      stored.fastModel = prefs.fastModel;
    }
    if (prefs.thinkingModel && prefs.thinkingModel !== env.OLLAMA_THINKING_MODEL) {
      stored.thinkingModel = prefs.thinkingModel;
    }

    const [existing] = await this.db
      .select()
      .from(userPreferences)
      .where(eq(userPreferences.userId, userId))
      .limit(1);

    if (Object.keys(stored).length === 0) {
      if (existing) {
        await this.db
          .delete(userPreferences)
          .where(eq(userPreferences.userId, userId));
      }
    } else if (existing) {
      await this.db
        .update(userPreferences)
        .set({ preferences: stored, updatedAt: new Date() })
        .where(eq(userPreferences.userId, userId));
    } else {
      await this.db
        .insert(userPreferences)
        .values({ userId, preferences: stored });
    }

    return this.getModelPreferences(userId);
  }

  async getAvailableModels(): Promise<OllamaModelTag[]> {
    const env = getEnv();
    const baseUrl = env.OLLAMA_BASE_URL.replace("/api", "");

    try {
      const response = await fetch(`${baseUrl}/api/tags`, {
        signal: AbortSignal.timeout(5000),
      });

      if (!response.ok) return [];

      const data = (await response.json()) as { models?: OllamaModelTag[] };

      const embeddingPatterns = [
        "embed", "e5-", "bge-", "gte-", "jina-emb",
        "minilm", "snowflake", "mxbai", "nomic-embed",
        "all-MiniLM", "multilingual-e5",
      ];

      const chatModels = (data.models ?? []).filter((m) => {
        const name = m.name.toLowerCase();
        return !embeddingPatterns.some((p) => name.includes(p));
      });

      return chatModels;
    } catch {
      return [];
    }
  }

  async getSystemInfo() {
    return {
      apiEndpoint: `http://localhost:${getEnv().API_PORT}`,
      sseEndpoint: `http://localhost:${getEnv().API_PORT}/api/v1/events/stream`,
      ollamaEndpoint: getEnv().OLLAMA_BASE_URL.replace("/api", ""),
      version: "0.1.0",
    };
  }
}
