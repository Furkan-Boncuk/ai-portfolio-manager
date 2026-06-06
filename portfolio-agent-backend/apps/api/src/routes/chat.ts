import { Elysia, t } from "elysia";
import { AgentRunner, WebSearchTool, FetchPageTool } from "@portfolio-agent/agent-core";
import { ChatService } from "../services/chat/ChatService";

const runner = new AgentRunner([new WebSearchTool(), new FetchPageTool()]);
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
