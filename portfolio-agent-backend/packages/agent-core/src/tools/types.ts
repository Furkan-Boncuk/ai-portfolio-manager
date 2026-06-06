export interface ToolInput {
  query: string;
  [key: string]: unknown;
}

export interface ToolResult {
  success: boolean;
  data: unknown;
  error?: string;
}

export interface Tool {
  name: string;
  description: string;
  execute(input: ToolInput): Promise<ToolResult>;
}
