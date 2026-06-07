import { getEnv, LLMError } from "@portfolio-agent/shared";
import type { LLMProvider, ChatMessage, ChatResponse, ToolDefinition, ToolCall } from "./types";

export class OllamaProvider implements LLMProvider {
  readonly name = "ollama";
  private baseUrl: string;
  private chatModel: string;
  private embedModel: string;

  constructor() {
    const env = getEnv();
    this.baseUrl = env.OLLAMA_BASE_URL;
    this.chatModel = env.OLLAMA_CHAT_MODEL;
    this.embedModel = env.OLLAMA_EMBEDDING_MODEL;
  }

  private readonly chatTimeout = 60000;
  private readonly embedTimeout = 15000;
  private readonly healthTimeout = 5000;

  async isAvailable(): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}/tags`, {
        signal: AbortSignal.timeout(this.healthTimeout),
      });
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
      model: this.chatModel,
      messages: messages.map((m) => {
        const msg: Record<string, unknown> = {
          role: m.role,
          content: m.content,
        };
        if (m.tool_calls) {
          msg.tool_calls = m.tool_calls.map((tc) => {
            let parsed: Record<string, unknown>;
            if (typeof tc.function.arguments === "string") {
              try {
                parsed = JSON.parse(tc.function.arguments) as Record<string, unknown>;
              } catch {
                parsed = { raw: tc.function.arguments };
              }
            } else {
              parsed = tc.function.arguments as Record<string, unknown>;
            }
            return {
              id: tc.id,
              type: tc.type,
              function: { name: tc.function.name, arguments: parsed },
            };
          });
        }
        if (m.tool_call_id) msg.tool_call_id = m.tool_call_id;
        if (m.name) msg.name = m.name;
        return msg;
      }),
      stream: false,
      options: {
        temperature: 0.0,
        top_p: 0.5,
        num_predict: 1000,
      },
    };

    if (tools && tools.length > 0) {
      body.tools = tools;
    }

    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(this.chatTimeout),
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
        tool_calls?: Array<{
          id?: string;
          type?: string;
          function: {
            name: string;
            arguments: string | Record<string, unknown>;
          };
        }>;
      };
      model: string;
    };

    const tool_calls: ToolCall[] | undefined = data.message.tool_calls?.map((tc) => ({
      id: tc.id ?? `call_${Date.now()}`,
      type: "function",
      function: {
        name: tc.function.name,
        arguments: typeof tc.function.arguments === "string"
          ? tc.function.arguments
          : JSON.stringify(tc.function.arguments),
      },
    }));

    return {
      content: data.message.content,
      model: data.model,
      tool_calls,
    };
  }

  async embed(text: string): Promise<number[]> {
    const url = `${this.baseUrl}/embed`;

    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ model: this.embedModel, input: text }),
      signal: AbortSignal.timeout(this.embedTimeout),
    });

    if (!response.ok) {
      throw new LLMError(`Ollama embed error: ${response.statusText}`, {
        status: response.status,
      });
    }

    const data = (await response.json()) as {
      embeddings: number[][];
    };

    const embedding = data.embeddings[0];
    if (!embedding) {
      throw new LLMError("Ollama returned empty embedding");
    }

    return embedding;
  }
}
