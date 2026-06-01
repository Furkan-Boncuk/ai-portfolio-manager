import { Elysia, t } from "elysia";
import { AgentRunner } from "@portfolio-agent/agent-core";

const runner = new AgentRunner();

export const chatRoutes = new Elysia({ prefix: "/chat" })
  .get("/sessions", () => ({ message: "Not implemented", status: 501 }))
  .post(
    "/sessions",
    async ({ body }) => {
      const response = await runner.chat(body.message);
      return { sessionId: "placeholder", response };
    },
    {
      body: t.Object({
        message: t.String(),
      }),
    }
  )
  .get("/sessions/:id/messages", () => ({ message: "Not implemented", status: 501 }))
  .post("/sessions/:id/messages", async ({ body }) => {
    const response = await runner.chat(body.message);
    return { response };
  }, {
    body: t.Object({
      message: t.String(),
    }),
  });
