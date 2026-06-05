export interface UserPreferences {
  theme: "dark" | "light";
  defaultAsset: string;
  riskProfile: "conservative" | "moderate" | "aggressive";
  notificationsEnabled: boolean;
}

export interface SystemConfig {
  apiEndpoint: string;
  sseEndpoint: string;
  ollamaEndpoint: string | null;
  version: string;
}

export interface SettingsData {
  preferences: UserPreferences;
  system: SystemConfig;
}
