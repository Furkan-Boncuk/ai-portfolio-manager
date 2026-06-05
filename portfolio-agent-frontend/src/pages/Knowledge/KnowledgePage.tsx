import { useQuery } from "@tanstack/react-query";
import { http } from "../../lib/api";
import { BrainCircuit, Globe, FileText, BookOpen } from "lucide-react";
import { SectionHeader } from "../../components/atoms/SectionHeader/SectionHeader";
import { EmptyCard } from "../../components/atoms/EmptyCard/EmptyCard";
import type { KnowledgeData } from "./Knowledge.interface";

export default function KnowledgePage() {
  const { data, isLoading } = useQuery<KnowledgeData>({
    queryKey: ["knowledge"],
    queryFn: () => http.get<KnowledgeData>("/api/v1/knowledge"),
    retry: false,
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
        Manage research sources, RAG documents, and the agent's knowledge base
        for informed decision-making.
      </p>

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
          <EmptyCard>No research sources configured yet.</EmptyCard>
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
          <EmptyCard>No documents ingested yet. Use Chat to add research.</EmptyCard>
        )}
      </section>

      <section className="bg-surface-raised border border-surface-border rounded-lg p-5">
        <SectionHeader icon={BookOpen} title="Knowledge Graph" />
        <EmptyCard>Knowledge graph visualization coming soon.</EmptyCard>
      </section>
    </div>
  );
}
