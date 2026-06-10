import { Elysia, t } from "elysia";
import { OllamaProvider, AgentRunner, WebSearchTool, FetchPageTool, RagIngestionTool, RagSearchTool, CryptoPriceTool } from "@portfolio-agent/agent-core";
import type { OllamaModelConfig } from "@portfolio-agent/agent-core";
import { getDb } from "@portfolio-agent/db";
import { RagRepository } from "@portfolio-agent/db/repositories/RagRepository";
import { getEnv } from "@portfolio-agent/shared";
import { ChatService } from "../services/chat/ChatService";
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

function createChatService() {
  const userId = getEnv().DEFAULT_USER_ID;
  const db = getDb();
  const settingsService = new SettingsService(db);

  return {
    async getRunner() {
      const prefs = await settingsService.getModelPreferences(userId);
      const runner = createRunner({
        fastModel: prefs.fastModel,
        thinkingModel: prefs.thinkingModel,
      });
      return new ChatService(runner);
    },
  };
}

const chatServiceFactory = createChatService();

export const chatRoutes = new Elysia({ prefix: "/chat" })
  .get("/sessions", async () => {
    const chat = await chatServiceFactory.getRunner();
    return chat.listSessions();
  })
  .post(
    "/sessions",
    async ({ body }) => {
      const chat = await chatServiceFactory.getRunner();
      if (body.message) {
        return chat.createSession(body.message);
      }
      return chat.createEmptySession();
    },
    { body: t.Object({ message: t.Optional(t.String()) }) },
  )
  .get("/sessions/:id", async ({ params }) => {
    const chat = await chatServiceFactory.getRunner();
    return chat.getSession(params.id);
  })
  .get("/sessions/:id/messages", async ({ params }) => {
    const chat = await chatServiceFactory.getRunner();
    return chat.getSessionMessages(params.id);
  })
  .post(
    "/sessions/:id/messages",
    async ({ params, body }) => {
      const chat = await chatServiceFactory.getRunner();
      return chat.chatInSession(params.id, body.message);
    },
    { body: t.Object({ message: t.String() }) },
  )
  .get(
    "/sessions/:id/stream",
    async ({ params, query, set }) => {
      const chat = await chatServiceFactory.getRunner();
      set.headers["content-type"] = "text/event-stream";
      set.headers["cache-control"] = "no-cache";
      set.headers["connection"] = "keep-alive";
      set.headers["x-accel-buffering"] = "no";
      return chat.chatInSessionStream(params.id, query.message);
    },
    { query: t.Object({ message: t.String() }) },
  )
  .patch(
    "/sessions/:id",
    async ({ params, body }) => {
      const chat = await chatServiceFactory.getRunner();
      return chat.updateSessionTitle(params.id, body.title);
    },
    { body: t.Object({ title: t.String() }) },
  )
  .delete("/sessions/:id", async ({ params }) => {
    const chat = await chatServiceFactory.getRunner();
    return chat.deleteSession(params.id);
  });
