import { Elysia } from "elysia";
import { KnowledgeService } from "../services/knowledge/KnowledgeService";
import type { KnowledgeData } from "../services/knowledge/KnowledgeService.types";

const knowledgeService = new KnowledgeService();

export const knowledgeRoutes = new Elysia({ prefix: "/knowledge" })
  .get("/", async (): Promise<KnowledgeData> => {
    return knowledgeService.getKnowledgeData();
  });
