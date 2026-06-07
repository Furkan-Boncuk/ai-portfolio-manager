import type { NodePgDatabase } from "drizzle-orm/node-postgres";

export type DbInstance = NodePgDatabase<Record<string, unknown>>;

export interface CreateDocumentInput {
  workspaceId: string;
  sourceId?: string;
  assetId?: string;
  title: string;
  documentType: string;
  originalUri?: string;
  contentHash?: string;
  metadata?: Record<string, unknown>;
}

export interface CreateChunkInput {
  documentId: string;
  chunkIndex: number;
  content: string;
  tokenCount?: number;
  embedding?: number[];
  metadata?: Record<string, unknown>;
}

export interface SimilarChunk {
  id: string;
  documentId: string;
  chunkIndex: number;
  content: string;
  tokenCount: number | null;
  metadata: Record<string, unknown>;
  distance: number;
}
