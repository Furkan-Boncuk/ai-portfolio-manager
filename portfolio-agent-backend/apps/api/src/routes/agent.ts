import { Elysia, t } from "elysia";
import { AgentRunner, OllamaProvider, WebSearchTool, FetchPageTool, RagIngestionTool, RagSearchTool, CryptoPriceTool } from "@portfolio-agent/agent-core";
import { getDb } from "@portfolio-agent/db";
import { RagRepository } from "@portfolio-agent/db/repositories/RagRepository";
import { AgentService } from "../services/agent/AgentService";

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
const agentService = new AgentService(runner);

export const agentRoutes = new Elysia({ prefix: "/agent" })
  .post("/chat", ({ body }) => agentService.chat(body.message, body.context), {
    body: t.Object({
      message: t.String(),
      context: t.Optional(t.String()),
    }),
  })
  .post(
    "/review-signal",
    ({ body }) => agentService.reviewSignal(body),
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
  )
  .post("/review-portfolio", () => ({ message: "Not implemented", status: 501 }))
  .get("/runs", () => ({ message: "Not implemented", status: 501 }))
  .get("/runs/:id", () => ({ message: "Not implemented", status: 501 }));
