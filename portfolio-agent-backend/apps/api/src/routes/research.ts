import { Elysia, t } from "elysia";
import { ResearchAnalystAgent } from "@portfolio-agent/agent-core";
import { getDb } from "@portfolio-agent/db";
import { RagRepository } from "@portfolio-agent/db/repositories/RagRepository";

const db = getDb();
const ragRepo = new RagRepository(db);
const researchAgent = new ResearchAnalystAgent(ragRepo);

export const researchRoutes = new Elysia({ prefix: "/research" })
  .post(
    "/ask",
    async ({ body }) => {
      const response = await researchAgent.ask(body.query);
      return { response };
    },
    { body: t.Object({ query: t.String() }) },
  )
  .post(
    "/deep-research",
    async ({ body }) => {
      const result = await researchAgent.research(body.query);
      return result;
    },
    { body: t.Object({ query: t.String() }) },
  );
