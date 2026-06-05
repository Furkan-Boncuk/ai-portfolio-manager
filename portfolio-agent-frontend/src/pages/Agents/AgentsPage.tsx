import { useQuery } from "@tanstack/react-query";
import { http } from "../../lib/api";
import { Bot, Cpu, Activity } from "lucide-react";
import { SectionHeader } from "../../components/atoms/SectionHeader/SectionHeader";
import { EmptyCard } from "../../components/atoms/EmptyCard/EmptyCard";
import type { AgentsData } from "./Agents.interface";

export default function AgentsPage() {
  const { data, isLoading } = useQuery<AgentsData>({
    queryKey: ["agents"],
    queryFn: () => http.get<AgentsData>("/api/v1/agents"),
    retry: false,
  });

  if (isLoading) {
    return (
      <div className="text-text-muted animate-pulse">
        <p>Loading agents...</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center gap-3 mb-6">
        <Bot className="w-6 h-6 text-brand-400" />
        <h1 className="text-2xl font-bold text-text-primary">Agents</h1>
      </div>

      <p className="text-text-secondary text-sm">
        Monitor active agents, review execution logs, and configure agent
        behaviors for market analysis and signal generation.
      </p>

      <section className="bg-surface-raised border border-surface-border rounded-lg p-5">
        <SectionHeader icon={Cpu} title="Active Agents" />
        {data?.agents && data.agents.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {data.agents.map((agent) => (
              <div key={agent.id} className="bg-surface-overlay rounded p-3">
                <p className="text-text-primary text-sm font-medium">{agent.name}</p>
                <p className="text-text-muted text-xs capitalize">{agent.type}</p>
              </div>
            ))}
          </div>
        ) : (
          <EmptyCard>No agents configured yet. Agents will appear once the system is running.</EmptyCard>
        )}
      </section>

      <section className="bg-surface-raised border border-surface-border rounded-lg p-5">
        <SectionHeader icon={Activity} title="Agent Logs" />
        {data?.logs && data.logs.length > 0 ? (
          <div className="space-y-1">
            {data.logs.map((log) => (
              <div key={log.id} className="text-xs text-text-muted">
                <span className="text-text-secondary">{log.timestamp}</span> [{log.level}] {log.message}
              </div>
            ))}
          </div>
        ) : (
          <EmptyCard>No agent logs yet. Logs will appear as agents execute tasks.</EmptyCard>
        )}
      </section>
    </div>
  );
}
