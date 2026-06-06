import type { AgentRunner } from "@portfolio-agent/agent-core";

export enum ChatRole {
  User = "user",
  Assistant = "assistant",
}

export interface ChatSession {
  id: string;
  userId: string;
  title: string | null;
  status: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface ChatMessage {
  id: string;
  sessionId: string;
  role: string;
  content: string;
  createdAt: Date;
}

export interface CreateSessionResult {
  session: ChatSession;
  response: string;
  messages: Pick<ChatMessage, "id" | "role" | "content">[];
}

export interface ChatInSessionResult {
  response: string;
  message: ChatMessage;
}

export interface ChatServiceDeps {
  agentRunner: AgentRunner;
}
