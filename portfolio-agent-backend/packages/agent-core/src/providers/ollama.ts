import { getEnv, LLMError } from "@portfolio-agent/shared";
import type { LLMProvider, ChatMessage, ChatResponse } from "./types";

export class OllamaProvider implements LLMProvider {
  readonly name = "ollama";
  private baseUrl: string;
  private model: string;

  constructor() {
    const env = getEnv();
    this.baseUrl = env.OLLAMA_BASE_URL;
    this.model = env.OLLAMA_CHAT_MODEL;
  }

  async isAvailable(): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}/tags`);
      return response.ok;
    } catch {
      return false;
    }
  }

  async chat(messages: ChatMessage[]): Promise<ChatResponse> {
    const url = `${this.baseUrl}/chat`;

    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: this.model,
        messages,
        stream: false,
        options: {
          temperature: 0.3,
          top_p: 0.9,
          num_predict: 200,
        },
      }),
    });

    if (!response.ok) {
      throw new LLMError(`Ollama API error: ${response.statusText}`, {
        status: response.status,
      });
    }

    const data = (await response.json()) as {
      message: { role: string; content: string };
      model: string;
    };

    return {
      content: data.message.content,
      model: data.model,
    };
  }
}
