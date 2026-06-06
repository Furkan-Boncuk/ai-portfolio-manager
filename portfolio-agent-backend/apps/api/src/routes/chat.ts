import { Elysia, t } from "elysia";
import { AgentRunner } from "@portfolio-agent/agent-core";
import {
  listSessions,
  getSessionById,
  createSession,
  updateSessionTitle,
  deleteSession,
  getMessages,
  insertMessage,
  updateSessionTimestamp,
} from "@portfolio-agent/db/repositories/chat";

enum ChatRole {
  User = "user",
  Assistant = "assistant",
}

const runner = new AgentRunner();
const DEFAULT_USER_ID = "fc650a01-85f1-4d63-afec-f3b7c99c5272";

export const chatRoutes = new Elysia({ prefix: "/chat" })
  .get("/sessions", async () => {
    const sessions = await listSessions(DEFAULT_USER_ID);
    return { data: sessions };
  })
  .post(
    "/sessions",
    async ({ body }) => {
      const session = await createSession({
        userId: DEFAULT_USER_ID,
      });
      const userMsg = await insertMessage({
        sessionId: session.id,
        role: ChatRole.User,
        content: body.message,
      });
      const response = await runner.chat(body.message);
      await insertMessage({
        sessionId: session.id,
        role: ChatRole.Assistant,
        content: response,
      });

      const title = response.length > 80
        ? response.slice(0, 80) + "..."
        : response;
      await updateSessionTitle(session.id, title);
      await updateSessionTimestamp(session.id);

      return {
        data: {
          sessionId: session.id,
          response,
          messages: [
            { id: userMsg.id, role: ChatRole.User, content: body.message },
            { role: ChatRole.Assistant, content: response },
          ],
        },
      };
    },
    {
      body: t.Object({
        message: t.String(),
      }),
    }
  )
  .get("/sessions/:id", async ({ params }) => {
    const session = await getSessionById(params.id);
    if (!session) return { error: "Session not found" };
    return { data: session };
  })
  .get("/sessions/:id/messages", async ({ params }) => {
    const msgs = await getMessages(params.id);
    return { data: msgs };
  })
  .post(
    "/sessions/:id/messages",
    async ({ params, body }) => {
      const session = await getSessionById(params.id);
      if (!session) return { error: "Session not found" };

      const history = await getMessages(params.id);
      const chatHistory = history.map((m) => {
        const role = m.role === ChatRole.Assistant ? ChatRole.Assistant : ChatRole.User;
        return { role, content: m.content };
      });

      await insertMessage({
        sessionId: params.id,
        role: ChatRole.User,
        content: body.message,
      });

      const response = await runner.chat(body.message, chatHistory);
      const assistantMsg = await insertMessage({
        sessionId: params.id,
        role: ChatRole.Assistant,
        content: response,
      });

      if (session.title === "New conversation" && response.length > 0) {
        const title = response.length > 80
          ? response.slice(0, 80) + "..."
          : response;
        await updateSessionTitle(params.id, title);
      }

      await updateSessionTimestamp(params.id);

      return {
        data: {
          response,
          message: {
            id: assistantMsg.id,
            role: ChatRole.Assistant,
            content: response,
            createdAt: assistantMsg.createdAt,
          },
        },
      };
    },
    {
      body: t.Object({
        message: t.String(),
      }),
    }
  )
  .patch(
    "/sessions/:id",
    async ({ params, body }) => {
      const session = await updateSessionTitle(params.id, body.title);
      if (!session) return { error: "Session not found" };
      return { data: session };
    },
    {
      body: t.Object({
        title: t.String(),
      }),
    }
  )
  .delete("/sessions/:id", async ({ params }) => {
    await deleteSession(params.id);
    return { ok: true };
  });
