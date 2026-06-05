export interface ToolDefinition {
  id: string;
  name: string;
  description: string;
  enabled: boolean;
}

export interface ToolExecution {
  id: string;
  toolId: string;
  status: "success" | "error" | "running";
  duration: number | null;
  timestamp: string;
}

export interface ToolsData {
  tools: ToolDefinition[];
  executions: ToolExecution[];
}
