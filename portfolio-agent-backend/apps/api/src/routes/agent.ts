import { Elysia, t } from "elysia";
import { OllamaProvider, AgentRunner, WebSearchTool, FetchPageTool, RagIngestionTool, RagSearchTool, CryptoPriceTool } from "@portfolio-agent/agent-core";
import type { OllamaModelConfig } from "@portfolio-agent/agent-core";
import { getDb } from "@portfolio-agent/db";
import { RagRepository } from "@portfolio-agent/db/repositories/RagRepository";
import { getEnv } from "@portfolio-agent/shared";
import { AgentService } from "../services/agent/AgentService";
import { SettingsService } from "../services/settings/SettingsService";

function createRunner(modelConfig?: OllamaModelConfig) {
  const db = getDb();
  const ragRepo = new RagRepository(db);
  const ollama = new OllamaProvider(modelConfig);
  const embedFn = (text: string) => ollama.embed(text);

  return new AgentRunner(
    [
      new CryptoPriceTool(),
      new WebSearchTool(),
      new FetchPageTool(),
      new RagIngestionTool(embedFn, ragRepo),
      new RagSearchTool(embedFn, ragRepo),
    ],
    undefined,
    modelConfig,
  );
}

function createAgentService() {
  const userId = getEnv().DEFAULT_USER_ID;
  const db = getDb();
  const settingsService = new SettingsService(db);

  return {
    async getService() {
      const prefs = await settingsService.getModelPreferences(userId);
      const runner = createRunner({
        fastModel: prefs.fastModel,
        thinkingModel: prefs.thinkingModel,
      });
      return new AgentService(runner);
    },
  };
}

const agentServiceFactory = createAgentService();

export const agentRoutes = new Elysia({ prefix: "/agent" })
  .post(
    "/chat",
    async ({ body }) => {
      const service = await agentServiceFactory.getService();
      return service.chat(body.message, body.context);
    },
    { body: t.Object({ message: t.String(), context: t.Optional(t.String()) }) },
  )
  .post(
    "/research",
    async ({ body }) => {
      const service = await agentServiceFactory.getService();
      return service.chat(body.message, body.context);
    },
    { body: t.Object({ message: t.String(), context: t.Optional(t.String()) }) },
  )
  .post(
    "/review-signal",
    async ({ body }) => {
      const service = await agentServiceFactory.getService();
      return service.reviewSignal(body);
    },
    {
      body: t.Object({
        asset: t.String(),
        direction: t.String(),
        timeframe: t.String(),
        entryLow: t.String(),
        entryHigh: t.String(),
        invalidationPrice: t.String(),
        takeProfit1: t.String(),
        riskLevel: t.String(),
        confidence: t.Number(),
        reasonSummary: t.String(),
      }),
    },
  );
