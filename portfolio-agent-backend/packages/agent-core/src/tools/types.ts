import type { ToolDefinition } from "../providers/types";

export interface Tool {
  definition: ToolDefinition;
  execute(input: Record<string, unknown>): Promise<string>;
}
