import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { http } from "../../lib/api";
import {
  BrainCircuit,
  Globe,
  FileText,
  BookOpen,
  Search,
  ExternalLink,
  Loader2,
} from "lucide-react";
import { SectionHeader } from "../../components/atoms/SectionHeader/SectionHeader";
import { EmptyCard } from "../../components/atoms/EmptyCard/EmptyCard";
import type { KnowledgeData } from "./Knowledge.interface";

export default function KnowledgePage() {
  const [ingestUrl, setIngestUrl] = useState("");
  const [searchQuery, setSearchQuery] = useState("");

  const { data, isLoading, refetch } = useQuery<KnowledgeData>({
    queryKey: ["knowledge"],
    queryFn: () => http.get<KnowledgeData>("/api/v1/knowledge"),
    retry: false,
  });

  const ingestMutation = useMutation({
    mutationFn: (url: string) =>
      http.post("/api/v1/research/deep-research", { query: `Fetch and save: ${url}` }),
    onSuccess: () => {
      setIngestUrl("");
      setTimeout(() => refetch(), 2000);
    },
  });

  const searchMutation = useMutation({
    mutationFn: (query: string) =>
      http.post<{ response: string }>("/api/v1/research/ask", { query }),
  });

  if (isLoading) {
    return (
      <div className="text-text-muted animate-pulse">
        <p>Loading knowledge base...</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center gap-3 mb-6">
        <BrainCircuit className="w-6 h-6 text-brand-400" />
        <h1 className="text-2xl font-bold text-text-primary">Knowledge</h1>
      </div>

      <p className="text-text-secondary text-sm">
        Ingest web content, search the knowledge base, and manage research sources for informed
        decision-making.
      </p>

      <section className="bg-surface-raised border border-surface-border rounded-lg p-5">
        <SectionHeader icon={ExternalLink} title="Ingest URL" />
        <div className="flex gap-2 mt-3">
          <input
            type="url"
            value={ingestUrl}
            onChange={(e) => setIngestUrl(e.target.value)}
            placeholder="https://example.com/article"
            className="flex-1 bg-surface-overlay border border-surface-border rounded px-3 py-2 text-sm text-text-primary placeholder-text-muted outline-none focus:border-brand-500"
          />
          <button
            onClick={() => ingestMutation.mutate(ingestUrl)}
            disabled={!ingestUrl || ingestMutation.isPending}
            className="bg-brand-600 hover:bg-brand-500 disabled:opacity-50 text-white text-sm px-4 py-2 rounded transition-colors"
          >
            {ingestMutation.isPending ? (
              <Loader2 className="w-4 h-4 animate-spin inline" />
            ) : (
              "Ingest"
            )}
          </button>
        </div>
        {ingestMutation.isSuccess && (
          <p className="text-semantic-success text-xs mt-2">Ingestion started. Results will appear shortly.</p>
        )}
        {ingestMutation.isError && (
          <p className="text-red-400 text-xs mt-2">Ingestion failed: {ingestMutation.error.message}</p>
        )}
      </section>

      <section className="bg-surface-raised border border-surface-border rounded-lg p-5">
        <SectionHeader icon={Search} title="Search Knowledge Base" />
        <div className="flex gap-2 mt-3">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && searchQuery) {
                searchMutation.mutate(searchQuery);
              }
            }}
            placeholder="Search ingested knowledge..."
            className="flex-1 bg-surface-overlay border border-surface-border rounded px-3 py-2 text-sm text-text-primary placeholder-text-muted outline-none focus:border-brand-500"
          />
          <button
            onClick={() => searchMutation.mutate(searchQuery)}
            disabled={!searchQuery || searchMutation.isPending}
            className="bg-surface-border hover:bg-surface-overlay disabled:opacity-50 text-sm px-4 py-2 rounded transition-colors"
          >
            {searchMutation.isPending ? (
              <Loader2 className="w-4 h-4 animate-spin inline" />
            ) : (
              "Search"
            )}
          </button>
        </div>
        {searchMutation.data && (
          <div className="mt-3 bg-surface-overlay rounded p-3 text-sm text-text-primary whitespace-pre-wrap">
            {searchMutation.data.response}
          </div>
        )}
        {searchMutation.isError && (
          <p className="text-red-400 text-xs mt-2">Search failed: {searchMutation.error.message}</p>
        )}
      </section>

      <section className="bg-surface-raised border border-surface-border rounded-lg p-5">
        <SectionHeader icon={Globe} title="Research Sources" />
        {data?.sources && data.sources.length > 0 ? (
          <div className="space-y-2">
            {data.sources.map((source) => (
              <div
                key={source.id}
                className="bg-surface-overlay rounded p-3 flex justify-between items-center"
              >
                <span className="text-text-primary text-sm">{source.name}</span>
                <span className="text-text-muted text-xs capitalize">{source.type}</span>
              </div>
            ))}
          </div>
        ) : (
          <EmptyCard>No research sources yet. Use the ingest form above to add content.</EmptyCard>
        )}
      </section>

      <section className="bg-surface-raised border border-surface-border rounded-lg p-5">
        <SectionHeader icon={FileText} title="RAG Documents" />
        {data?.documents && data.documents.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {data.documents.map((doc) => (
              <div key={doc.id} className="bg-surface-overlay rounded p-3">
                <p className="text-text-primary text-sm font-medium">{doc.title}</p>
                <p className="text-text-muted text-xs">
                  {doc.chunkCount} chunks &middot; {doc.source}
                </p>
              </div>
            ))}
          </div>
        ) : (
          <EmptyCard>No documents ingested yet. Use the ingest form above to add content.</EmptyCard>
        )}
      </section>

      <section className="bg-surface-raised border border-surface-border rounded-lg p-5">
        <SectionHeader icon={BookOpen} title="Knowledge Graph" />
        <EmptyCard>Knowledge graph visualization coming soon.</EmptyCard>
      </section>
    </div>
  );
}
