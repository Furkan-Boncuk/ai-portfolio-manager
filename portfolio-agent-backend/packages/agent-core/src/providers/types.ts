export type MessageRole = "system" | "user" | "assistant" | "tool";

export interface ChatMessage {
  role: MessageRole;
  content: string;
  tool_calls?: ToolCall[];
  tool_call_id?: string;
  name?: string;
}

export interface ChatResponse {
  content: string;
  model: string;
  tool_calls?: ToolCall[];
}

export interface ToolDefinition {
  type: "function";
  function: {
    name: string;
    description: string;
    parameters: Record<string, unknown>;
  };
}

export interface ToolCall {
  id: string;
  type: "function";
  function: {
    name: string;
    arguments: string;
  };
}

export interface LLMProvider {
  readonly name: string;
  chat(messages: ChatMessage[], tools?: ToolDefinition[]): Promise<ChatResponse>;
  isAvailable(): Promise<boolean>;
  embed(text: string): Promise<number[]>;
}
