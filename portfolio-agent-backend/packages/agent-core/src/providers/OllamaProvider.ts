import { getEnv, LLMError } from "@portfolio-agent/shared";
import type { LLMProvider, ChatMessage, ChatResponse, ToolDefinition, ToolCall, ChatOptions, StreamChunk } from "./types";
import { ModelRoute } from "./types";

export interface OllamaModelConfig {
  fastModel?: string;
  thinkingModel?: string;
}

export class OllamaProvider implements LLMProvider {
  readonly name = "ollama";
  private baseUrl: string;
  private fastModel: string;
  private thinkingModel: string;
  private embedModel: string;

  constructor(models?: OllamaModelConfig) {
    const env = getEnv();
    this.baseUrl = env.OLLAMA_BASE_URL;
    this.fastModel = models?.fastModel ?? env.OLLAMA_FAST_MODEL;
    this.thinkingModel = models?.thinkingModel ?? env.OLLAMA_THINKING_MODEL;
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
    options?: ChatOptions,
  ): Promise<ChatResponse> {
    const model = options?.model === ModelRoute.Thinking
      ? this.thinkingModel
      : this.fastModel;

    return this.chatWithModel(model, messages, tools);
  }

  async chatStream(
    messages: ChatMessage[],
    tools?: ToolDefinition[],
    options?: ChatOptions,
  ): Promise<ReadableStream<StreamChunk>> {
    const model = options?.model === ModelRoute.Thinking
      ? this.thinkingModel
      : this.fastModel;

    const url = `${this.baseUrl}/chat`;
    const body = this.buildRequestBody(model, messages, tools, true);

    const abortController = new AbortController();
    const timeoutId = setTimeout(() => abortController.abort(), this.chatTimeout);

    let response: Response;
    try {
      response = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
        signal: abortController.signal,
      });
    } finally {
      clearTimeout(timeoutId);
    }

    if (!response.ok) {
      throw new LLMError(`Ollama API error: ${response.statusText}`, {
        status: response.status,
      });
    }

    const ollamaBody = response.body;
    if (!ollamaBody) {
      throw new LLMError("Ollama returned empty stream body");
    }

    const decoder = new TextDecoder();
    let buffer = "";

    return new ReadableStream<StreamChunk>({
      async pull(controller) {
        const reader = ollamaBody.getReader();
        try {
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            buffer += decoder.decode(value, { stream: true });
            const lines = buffer.split("\n");
            buffer = lines.pop() ?? "";

            for (const line of lines) {
              const trimmed = line.trim();
              if (!trimmed) continue;

              try {
                const parsed = JSON.parse(trimmed) as {
                  message?: { content?: string; reasoning_content?: string; thinking?: string };
                  done: boolean;
                };

                controller.enqueue({
                  content: parsed.message?.content ?? "",
                  reasoning: parsed.message?.thinking ?? parsed.message?.reasoning_content,
                  done: parsed.done,
                });

                if (parsed.done) {
                  controller.close();
                  return;
                }
              } catch {
                // skip malformed lines
              }
            }
          }
          controller.close();
        } catch (error) {
          controller.error(error);
        } finally {
          reader.releaseLock();
        }
      },
    });
  }

  private buildRequestBody(
    model: string,
    messages: ChatMessage[],
    tools?: ToolDefinition[],
    stream?: boolean,
  ): Record<string, unknown> {
    const body: Record<string, unknown> = {
      model,
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
      stream: stream ?? false,
      options: {
        temperature: stream ? 0.1 : 0.0,
        top_p: 0.9,
        num_predict: stream ? 8192 : 2048,
      },
    };

    if (tools && tools.length > 0) {
      body.tools = tools;
    }

    return body;
  }

  private async chatWithModel(
    model: string,
    messages: ChatMessage[],
    tools?: ToolDefinition[],
  ): Promise<ChatResponse> {
    const url = `${this.baseUrl}/chat`;
    const body = this.buildRequestBody(model, messages, tools, false);

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
        reasoning_content?: string;
        thinking?: string;
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
      reasoning: data.message.thinking ?? data.message.reasoning_content,
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
