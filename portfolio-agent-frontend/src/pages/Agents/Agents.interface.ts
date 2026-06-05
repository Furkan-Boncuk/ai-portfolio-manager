export interface Agent {
  id: string;
  name: string;
  type: "market-watcher" | "signal-evaluator" | "research" | "decision-advisor";
  status: "running" | "idle" | "error" | "disabled";
  lastRun: string | null;
}

export interface AgentLog {
  id: string;
  agentId: string;
  level: "info" | "warn" | "error";
  message: string;
  timestamp: string;
}

export interface AgentsData {
  agents: Agent[];
  logs: AgentLog[];
}
