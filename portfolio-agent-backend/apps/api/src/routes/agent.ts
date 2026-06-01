import { Elysia, t } from "elysia";
import { AgentRunner } from "@portfolio-agent/agent-core";

const runner = new AgentRunner();

export const agentRoutes = new Elysia({ prefix: "/agent" })
  .post(
    "/chat",
    async ({ body }) => {
      const response = await runner.chat(body.message, body.context);
      return { response };
    },
    {
      body: t.Object({
        message: t.String(),
        context: t.Optional(t.String()),
      }),
    }
  )
  .post(
    "/review-signal",
    async ({ body }) => {
      const response = await runner.reviewSignal({
        asset: body.asset,
        direction: body.direction,
        timeframe: body.timeframe,
        entryLow: body.entryLow,
        entryHigh: body.entryHigh,
        invalidationPrice: body.invalidationPrice,
        takeProfit1: body.takeProfit1,
        riskLevel: body.riskLevel,
        confidence: body.confidence,
        reasonSummary: body.reasonSummary,
      });
      return { response };
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
    }
  )
  .post("/review-portfolio", () => ({ message: "Not implemented", status: 501 }))
  .get("/runs", () => ({ message: "Not implemented", status: 501 }))
  .get("/runs/:id", () => ({ message: "Not implemented", status: 501 }));
