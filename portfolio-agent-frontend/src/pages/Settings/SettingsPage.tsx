import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { http } from "../../lib/api";
import { Settings, Sliders, Server, Cpu, Brain } from "lucide-react";
import { SectionHeader } from "../../components/atoms/SectionHeader/SectionHeader";
import { EmptyCard } from "../../components/atoms/EmptyCard/EmptyCard";
import type { SettingsData, ModelPreferences } from "./Settings.interface";
import { useState } from "react";

export default function SettingsPage() {
  const queryClient = useQueryClient();
  const { data, isLoading } = useQuery<SettingsData>({
    queryKey: ["settings"],
    queryFn: () => http.get<SettingsData>("/api/v1/settings"),
    retry: false,
  });

  const [fastModel, setFastModel] = useState("");
  const [thinkingModel, setThinkingModel] = useState("");

  const mutation = useMutation({
    mutationFn: (prefs: ModelPreferences) =>
      http.patch("/api/v1/settings/models", prefs),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["settings"] });
    },
  });

  const handleSave = () => {
    mutation.mutate({ fastModel, thinkingModel });
  };

  if (isLoading) {
    return (
      <div className="text-text-muted animate-pulse">
        <p>Loading settings...</p>
      </div>
    );
  }

  const defaultFast = data?.preferences.fastModel ?? "";
  const defaultThinking = data?.preferences.thinkingModel ?? "";
  const models = data?.availableModels ?? [];

  const currentFast = fastModel || defaultFast;
  const currentThinking = thinkingModel || defaultThinking;
  const hasChanges = currentFast !== defaultFast || currentThinking !== defaultThinking;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center gap-3 mb-6">
        <Settings className="w-6 h-6 text-brand-400" />
        <h1 className="text-2xl font-bold text-text-primary">Settings</h1>
      </div>

      <section className="bg-surface-raised border border-surface-border rounded-lg p-5">
        <SectionHeader icon={Brain} title="Model Preferences" />

        <p className="text-text-secondary text-sm mb-4">
          Select which Ollama models to use for fast (tool calling, simple chat) and thinking (analysis, research) tasks.
        </p>

        {models.length > 0 ? (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-text-primary mb-1">
                <Cpu className="w-4 h-4 inline mr-1 text-brand-400" />
                Fast Model (tool calling, quick responses)
              </label>
              <select
                className="w-full bg-surface-overlay border border-surface-border rounded px-3 py-2 text-text-primary text-sm"
                value={currentFast}
                onChange={(e) => setFastModel(e.target.value)}
              >
                {models.map((m) => (
                  <option key={m.name} value={m.name}>
                    {m.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-text-primary mb-1">
                <Brain className="w-4 h-4 inline mr-1 text-purple-400" />
                Thinking Model (analysis, research, signal review)
              </label>
              <select
                className="w-full bg-surface-overlay border border-surface-border rounded px-3 py-2 text-text-primary text-sm"
                value={currentThinking}
                onChange={(e) => setThinkingModel(e.target.value)}
              >
                {models.map((m) => (
                  <option key={m.name} value={m.name}>
                    {m.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-center gap-3">
              <button
                className={`px-4 py-2 rounded text-sm font-medium transition-colors ${
                  hasChanges
                    ? "bg-brand-500 text-white hover:bg-brand-400"
                    : "bg-surface-border text-text-muted cursor-not-allowed"
                }`}
                disabled={!hasChanges}
                onClick={handleSave}
              >
                {mutation.isPending ? "Saving..." : "Save"}
              </button>
              {mutation.isSuccess && (
                <span className="text-green-400 text-sm">Saved</span>
              )}
              {mutation.isError && (
                <span className="text-red-400 text-sm">Failed to save</span>
              )}
            </div>
          </div>
        ) : (
          <EmptyCard>
            No models found in Ollama. Make sure Ollama is running and has models pulled.{" "}
            <code className="text-xs bg-surface-overlay px-1 rounded">docker exec ollama ollama pull qwen3:8b</code>
          </EmptyCard>
        )}
      </section>

      <section className="bg-surface-raised border border-surface-border rounded-lg p-5">
        <SectionHeader icon={Cpu} title="Active Models" />
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-text-secondary">Fast Model</span>
            <span className="text-text-primary font-mono text-xs">{currentFast}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-text-secondary">Thinking Model</span>
            <span className="text-text-primary font-mono text-xs">{currentThinking}</span>
          </div>
        </div>
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
