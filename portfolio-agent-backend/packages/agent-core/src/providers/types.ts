export interface ChatMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

export interface ChatResponse {
  content: string;
  model: string;
}

export interface LLMProvider {
  readonly name: string;
  chat(messages: ChatMessage[]): Promise<ChatResponse>;
  isAvailable(): Promise<boolean>;
}
