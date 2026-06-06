import { getEnv, LLMError } from "@portfolio-agent/shared";
import type { LLMProvider, ChatMessage, ChatResponse, ToolDefinition, ToolCall } from "./types";

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

  async chat(
    messages: ChatMessage[],
    tools?: ToolDefinition[],
  ): Promise<ChatResponse> {
    const url = `${this.baseUrl}/chat`;

    const body: Record<string, unknown> = {
      model: this.model,
      messages: messages.map((m) => {
        const msg: Record<string, unknown> = {
          role: m.role,
          content: m.content,
        };
        if (m.tool_calls) msg.tool_calls = m.tool_calls;
        if (m.tool_call_id) msg.tool_call_id = m.tool_call_id;
        if (m.name) msg.name = m.name;
        return msg;
      }),
      stream: false,
      options: {
        temperature: 0.3,
        top_p: 0.9,
        num_predict: 200,
      },
    };

    if (tools && tools.length > 0) {
      body.tools = tools;
    }

    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      throw new LLMError(`Ollama API error: ${response.statusText}`, {
        status: response.status,
      });
    }

    const data = (await response.json()) as {
      message: {
        role: string;
        content: string;
        tool_calls?: ToolCall[];
      };
      model: string;
    };

    return {
      content: data.message.content,
      model: data.model,
      tool_calls: data.message.tool_calls,
    };
  }
}
