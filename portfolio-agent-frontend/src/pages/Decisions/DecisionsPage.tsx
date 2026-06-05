import { useQuery } from "@tanstack/react-query";
import { http } from "../../lib/api";
import { Shield, Target, FileText, Activity, AlertTriangle } from "lucide-react";
import { SectionHeader } from "../../components/atoms/SectionHeader/SectionHeader";
import { EmptyCard } from "../../components/atoms/EmptyCard/EmptyCard";
import type { DecisionsData } from "./Decisions.interface";

export default function DecisionsPage() {
  const { data, isLoading } = useQuery<DecisionsData>({
    queryKey: ["decisions"],
    queryFn: () => http.get<DecisionsData>("/api/v1/decisions"),
    retry: false,
  });

  if (isLoading) {
    return (
      <div className="text-text-muted animate-pulse">
        <p>Loading decisions...</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center gap-3 mb-6">
        <Shield className="w-6 h-6 text-brand-400" />
        <h1 className="text-2xl font-bold text-text-primary">Decisions</h1>
      </div>

      <p className="text-text-secondary text-sm">
        Review and manage agent decisions, risk policies, goals, strategies,
        investment theses, and monitoring rules.
      </p>

      <section className="bg-surface-raised border border-surface-border rounded-lg p-5">
        <SectionHeader icon={Shield} title="Risk Profile" />
        <div className="text-text-secondary text-sm space-y-1">
          <p>
            Risk tolerance:{" "}
            <span className="text-text-primary font-medium">
              {data?.riskProfile ?? "moderate"}
            </span>
          </p>
        </div>
      </section>

      <section className="bg-surface-raised border border-surface-border rounded-lg p-5">
        <SectionHeader icon={Target} title="Portfolio Goals" />
        {data?.goals && data.goals.length > 0 ? (
          <div className="space-y-2">
            {data.goals.map((goal, i) => (
              <div
                key={i}
                className="bg-surface-overlay rounded p-3 flex justify-between items-center"
              >
                <span className="text-text-primary text-sm">{goal.title}</span>
                <span className="text-text-muted text-xs">
                  {goal.target} ({goal.progress})
                </span>
              </div>
            ))}
          </div>
        ) : (
          <EmptyCard>No goals defined yet. Use Chat to set financial targets.</EmptyCard>
        )}
      </section>

      <section className="bg-surface-raised border border-surface-border rounded-lg p-5">
        <SectionHeader icon={Activity} title="Strategy Configurations" />
        {data?.strategyConfigs && data.strategyConfigs.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {data.strategyConfigs.map((cfg, i) => (
              <div key={i} className="bg-surface-overlay rounded p-3">
                <p className="text-text-primary text-sm font-medium">{cfg.name}</p>
                <p className="text-text-muted text-xs">
                  {cfg.type} &middot; {cfg.timeframe}
                </p>
              </div>
            ))}
          </div>
        ) : (
          <EmptyCard>No strategy configurations yet.</EmptyCard>
        )}
      </section>

      <section className="bg-surface-raised border border-surface-border rounded-lg p-5">
        <SectionHeader icon={FileText} title="Investment Theses" />
        {data?.theses && data.theses.length > 0 ? (
          <div className="space-y-2">
            {data.theses.map((thesis, i) => (
              <div
                key={i}
                className="bg-surface-overlay rounded p-3 flex justify-between items-center"
              >
                <span className="text-text-primary text-sm">{thesis.title}</span>
                <span className="text-text-muted text-xs capitalize">{thesis.status}</span>
              </div>
            ))}
          </div>
        ) : (
          <EmptyCard>No active investment theses.</EmptyCard>
        )}
      </section>

      <section className="bg-surface-raised border border-surface-border rounded-lg p-5">
        <SectionHeader icon={AlertTriangle} title="Monitoring Rules" />
        {data?.monitoringRules && data.monitoringRules.length > 0 ? (
          <div className="space-y-2">
            {data.monitoringRules.map((rule, i) => (
              <div
                key={i}
                className="flex items-center gap-3 bg-surface-overlay rounded p-3"
              >
                <span
                  className={`w-2 h-2 rounded-full ${
                    rule.enabled ? "bg-semantic-success" : "bg-text-muted"
                  }`}
                />
                <span className="text-text-primary text-sm">{rule.rule}</span>
              </div>
            ))}
          </div>
        ) : (
          <EmptyCard>No monitoring rules configured.</EmptyCard>
        )}
      </section>
    </div>
  );
}
