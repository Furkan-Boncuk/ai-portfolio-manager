import { useQuery } from "@tanstack/react-query";
import { http } from "../../lib/api";
import { Settings, Sliders, Server } from "lucide-react";
import { SectionHeader } from "../../components/atoms/SectionHeader/SectionHeader";
import { EmptyCard } from "../../components/atoms/EmptyCard/EmptyCard";
import type { SettingsData } from "./Settings.interface";

export default function SettingsPage() {
  const { data, isLoading } = useQuery<SettingsData>({
    queryKey: ["settings"],
    queryFn: () => http.get<SettingsData>("/api/v1/settings"),
    retry: false,
  });

  if (isLoading) {
    return (
      <div className="text-text-muted animate-pulse">
        <p>Loading settings...</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center gap-3 mb-6">
        <Settings className="w-6 h-6 text-brand-400" />
        <h1 className="text-2xl font-bold text-text-primary">Settings</h1>
      </div>

      <p className="text-text-secondary text-sm">
        Configure user preferences and view system information.
      </p>

      <section className="bg-surface-raised border border-surface-border rounded-lg p-5">
        <SectionHeader icon={Sliders} title="User Preferences" />
        {data?.preferences ? (
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-text-secondary">Theme</span>
              <span className="text-text-primary capitalize">{data.preferences.theme}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-text-secondary">Default Asset</span>
              <span className="text-text-primary">{data.preferences.defaultAsset}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-text-secondary">Risk Profile</span>
              <span className="text-text-primary capitalize">{data.preferences.riskProfile}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-text-secondary">Notifications</span>
              <span className="text-text-primary">{data.preferences.notificationsEnabled ? "Enabled" : "Disabled"}</span>
            </div>
          </div>
        ) : (
          <EmptyCard>No preferences loaded.</EmptyCard>
        )}
      </section>

      <section className="bg-surface-raised border border-surface-border rounded-lg p-5">
        <SectionHeader icon={Server} title="System Information" />
        {data?.system ? (
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-text-secondary">API Endpoint</span>
              <span className="text-text-primary">{data.system.apiEndpoint}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-text-secondary">SSE Endpoint</span>
              <span className="text-text-primary">{data.system.sseEndpoint}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-text-secondary">Ollama Endpoint</span>
              <span className="text-text-primary">{data.system.ollamaEndpoint ?? "Not configured"}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-text-secondary">Version</span>
              <span className="text-text-primary">{data.system.version}</span>
            </div>
          </div>
        ) : (
          <EmptyCard>No system information available.</EmptyCard>
        )}
      </section>
    </div>
  );
}
