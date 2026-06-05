export interface ResearchSource {
  id: string;
  name: string;
  type: "document" | "url" | "rss" | "api";
  enabled: boolean;
  lastSync: string | null;
}

export interface RagDocument {
  id: string;
  title: string;
  chunkCount: number;
  source: string;
  ingestedAt: string;
}

export interface KnowledgeData {
  sources: ResearchSource[];
  documents: RagDocument[];
}
