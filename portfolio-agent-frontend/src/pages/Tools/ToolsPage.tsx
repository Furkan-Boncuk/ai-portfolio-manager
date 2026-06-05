import { useQuery } from "@tanstack/react-query";
import { http } from "../../lib/api";
import { Wrench, Puzzle, History } from "lucide-react";
import { SectionHeader } from "../../components/atoms/SectionHeader/SectionHeader";
import { EmptyCard } from "../../components/atoms/EmptyCard/EmptyCard";
import type { ToolsData } from "./Tools.interface";

export default function ToolsPage() {
  const { data, isLoading } = useQuery<ToolsData>({
    queryKey: ["tools"],
    queryFn: () => http.get<ToolsData>("/api/v1/tools"),
    retry: false,
  });

  if (isLoading) {
    return (
      <div className="text-text-muted animate-pulse">
        <p>Loading tools...</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center gap-3 mb-6">
        <Wrench className="w-6 h-6 text-brand-400" />
        <h1 className="text-2xl font-bold text-text-primary">Tools</h1>
      </div>

      <p className="text-text-secondary text-sm">
        Configure and monitor the tools available to agents for market
        research, data analysis, and decision support.
      </p>

      <section className="bg-surface-raised border border-surface-border rounded-lg p-5">
        <SectionHeader icon={Puzzle} title="Available Tools" />
        {data?.tools && data.tools.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {data.tools.map((tool) => (
              <div key={tool.id} className="bg-surface-overlay rounded p-3">
                <p className="text-text-primary text-sm font-medium">{tool.name}</p>
                <p className="text-text-muted text-xs">{tool.description}</p>
              </div>
            ))}
          </div>
        ) : (
          <EmptyCard>No tools configured yet. Tools will appear once the system is running.</EmptyCard>
        )}
      </section>

      <section className="bg-surface-raised border border-surface-border rounded-lg p-5">
        <SectionHeader icon={History} title="Execution Logs" />
        {data?.executions && data.executions.length > 0 ? (
          <div className="space-y-2">
            {data.executions.map((exec) => (
              <div key={exec.id} className="bg-surface-overlay rounded p-3 flex justify-between items-center">
                <span className="text-text-primary text-sm">{exec.toolId}</span>
                <span className="text-text-muted text-xs capitalize">{exec.status}</span>
              </div>
            ))}
          </div>
        ) : (
          <EmptyCard>No execution logs yet. Logs will appear as agents use tools.</EmptyCard>
        )}
      </section>
    </div>
  );
}
