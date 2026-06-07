import { Elysia, t } from "elysia";
import { AgentRunner, OllamaProvider, WebSearchTool, FetchPageTool, RagIngestionTool, RagSearchTool, CryptoPriceTool } from "@portfolio-agent/agent-core";
import { getDb } from "@portfolio-agent/db";
import { RagRepository } from "@portfolio-agent/db/repositories/RagRepository";
import { ChatService } from "../services/chat/ChatService";

const ollama = new OllamaProvider();
const db = getDb();
const ragRepo = new RagRepository(db);
const runner = new AgentRunner([
  new CryptoPriceTool(),
  new WebSearchTool(),
  new FetchPageTool(),
  new RagIngestionTool((text) => ollama.embed(text), ragRepo),
  new RagSearchTool((text) => ollama.embed(text), ragRepo),
]);
const chatService = new ChatService(runner);

export const chatRoutes = new Elysia({ prefix: "/chat" })
  .get("/sessions", () => chatService.listSessions())
  .post(
    "/sessions",
    ({ body }) => chatService.createSession(body.message),
    { body: t.Object({ message: t.String() }) },
  )
  .get("/sessions/:id", ({ params }) => chatService.getSession(params.id))
  .get("/sessions/:id/messages", ({ params }) =>
    chatService.getSessionMessages(params.id),
  )
  .post(
    "/sessions/:id/messages",
    ({ params, body }) =>
      chatService.chatInSession(params.id, body.message),
    { body: t.Object({ message: t.String() }) },
  )
  .patch(
    "/sessions/:id",
    ({ params, body }) =>
      chatService.updateSessionTitle(params.id, body.title),
    { body: t.Object({ title: t.String() }) },
  )
  .delete("/sessions/:id", ({ params }) =>
    chatService.deleteSession(params.id),
  );
