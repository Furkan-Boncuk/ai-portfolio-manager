export interface ModelPreferences {
  fastModel: string;
  thinkingModel: string;
}

export interface OllamaModelTag {
  name: string;
  size: number;
  modifiedAt: string;
}

export interface SystemConfig {
  apiEndpoint: string;
  sseEndpoint: string;
  ollamaEndpoint: string | null;
  version: string;
}

export interface SettingsData {
  preferences: ModelPreferences;
  system: SystemConfig;
  availableModels: OllamaModelTag[];
}
