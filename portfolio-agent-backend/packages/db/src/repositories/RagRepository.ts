import { eq, sql } from "drizzle-orm";
import { ragDocuments, ragChunks } from "../schema";
import type { DbInstance, CreateDocumentInput, CreateChunkInput, SimilarChunk } from "./RagRepository.types";

export class RagRepository {
  constructor(private db: DbInstance) {}

  async createDocument(data: CreateDocumentInput) {
    const [result] = await this.db
      .insert(ragDocuments)
      .values({
        workspaceId: data.workspaceId,
        sourceId: data.sourceId,
        assetId: data.assetId,
        title: data.title,
        documentType: data.documentType,
        originalUri: data.originalUri,
        contentHash: data.contentHash,
        metadata: (data.metadata ?? {}) as Record<string, unknown>,
      })
      .returning();
    return result;
  }

  async findDocumentById(id: string) {
    const [result] = await this.db
      .select()
      .from(ragDocuments)
      .where(eq(ragDocuments.id, id))
      .limit(1);
    return result ?? null;
  }

  async deleteDocument(id: string) {
    await this.db.transaction(async (tx) => {
      await tx.delete(ragChunks).where(eq(ragChunks.documentId, id));
      await tx.delete(ragDocuments).where(eq(ragDocuments.id, id));
    });
  }

  async createChunks(chunks: CreateChunkInput[]) {
    if (chunks.length === 0) return [];
    return this.db
      .insert(ragChunks)
      .values(
        chunks.map((c) => ({
          documentId: c.documentId,
          chunkIndex: c.chunkIndex,
          content: c.content,
          tokenCount: c.tokenCount,
          embedding: c.embedding ? sql`${JSON.stringify(c.embedding)}::vector` : undefined,
          metadata: (c.metadata ?? {}) as Record<string, unknown>,
        })),
      )
      .returning();
  }

  async searchSimilar(
    embedding: number[],
    limit: number = 5,
    minScore?: number,
  ): Promise<SimilarChunk[]> {
    const embeddingStr = JSON.stringify(embedding);
    const scoreClause = minScore !== undefined
      ? sql`AND 1 - (embedding <=> ${sql.raw(embeddingStr)}::vector) >= ${minScore}`
      : sql``;

    const result = await this.db.execute<Record<string, unknown>>(
      sql`
        SELECT
          id,
          document_id,
          chunk_index,
          content,
          token_count,
          metadata,
          1 - (embedding <=> ${sql.raw(embeddingStr)}::vector) AS distance
        FROM rag_chunks
        WHERE embedding IS NOT NULL
        ${scoreClause}
        ORDER BY embedding <=> ${sql.raw(embeddingStr)}::vector
        LIMIT ${limit}
      `,
    );

    return result.rows.map((row) => ({
      id: String(row.id),
      documentId: String(row.document_id),
      chunkIndex: Number(row.chunk_index),
      content: String(row.content),
      tokenCount: row.token_count ? Number(row.token_count) : null,
      metadata: typeof row.metadata === "object" ? (row.metadata as Record<string, unknown>) : {},
      distance: Number(row.distance),
    }));
  }
}
