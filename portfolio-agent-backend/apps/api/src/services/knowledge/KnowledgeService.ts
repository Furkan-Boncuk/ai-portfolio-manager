import { getDb } from "@portfolio-agent/db";
import { researchSources, ragDocuments, ragChunks } from "@portfolio-agent/db/schema";
import { sql, count } from "drizzle-orm";
import type { KnowledgeData } from "./KnowledgeService.types";

export class KnowledgeService {
  async getKnowledgeData(): Promise<KnowledgeData> {
    const db = getDb();

    const sources = await db
      .select({
        id: researchSources.id,
        name: researchSources.title,
        type: researchSources.sourceType,
        lastSync: researchSources.fetchedAt,
      })
      .from(researchSources)
      .orderBy(researchSources.fetchedAt);

    const documents = await db
      .select({
        id: ragDocuments.id,
        title: ragDocuments.title,
        source: ragDocuments.originalUri,
        ingestedAt: ragDocuments.createdAt,
        chunkCount: sql<number>`COALESCE((SELECT ${count()} FROM ${ragChunks} WHERE ${ragChunks.documentId} = ${ragDocuments.id}), 0)`,
      })
      .from(ragDocuments)
      .orderBy(ragDocuments.createdAt);

    return {
      sources: sources.map((s) => ({
        id: s.id,
        name: s.name,
        type: s.type ?? "url",
        enabled: true,
        lastSync: s.lastSync?.toISOString() ?? null,
      })),
      documents: documents.map((d) => ({
        id: d.id,
        title: d.title,
        chunkCount: Number(d.chunkCount),
        source: d.source ?? "web",
        ingestedAt: d.ingestedAt?.toISOString() ?? new Date().toISOString(),
      })),
    };
  }
}
