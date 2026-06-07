import { z } from "zod";
import type { Tool } from "./types";
import type { RagRepository } from "@portfolio-agent/db/repositories/RagRepository";

export const ragSearchInputSchema = z.object({
  query: z.string().min(1, "Search query is required"),
  limit: z.number().int().min(1).max(20).default(5),
  minScore: z.number().min(0).max(1).optional(),
});

export type RagSearchInput = z.infer<typeof ragSearchInputSchema>;

export class RagSearchTool implements Tool {
  constructor(
    private embedFn: (text: string) => Promise<number[]>,
    private ragRepo: RagRepository,
  ) {}

  get definition() {
    return {
      type: "function" as const,
      function: {
        name: "rag.search",
        description:
          "Search the knowledge base using semantic similarity. Returns relevant document chunks matching the query. Use this to retrieve previously ingested research, analysis, or any stored knowledge.",
        parameters: {
          type: "object",
          properties: {
            query: {
              type: "string",
              description: "The search query to find relevant content",
            },
            limit: {
              type: "number",
              description: "Maximum number of results to return (1-20)",
              default: 5,
            },
            minScore: {
              type: "number",
              description: "Minimum similarity score (0-1) to filter results",
            },
          },
          required: ["query"],
        },
      },
    };
  }

  async execute(input: Record<string, unknown>): Promise<string> {
    const parsed = ragSearchInputSchema.safeParse(input);
    if (!parsed.success) {
      return `Error: Invalid input - ${parsed.error.message}`;
    }

    const { query, limit, minScore } = parsed.data;

    try {
      const embedding = await this.embedFn(query);
      const results = await this.ragRepo.searchSimilar(embedding, limit, minScore);

      if (results.length === 0) {
        return "No relevant content found in the knowledge base.";
      }

      const lines: string[] = [
        `Found ${results.length} relevant result(s):`,
        "",
      ];

      for (let i = 0; i < results.length; i++) {
        const r = results[i]!;
        lines.push(`--- Result ${i + 1} (score: ${(r.distance * 100).toFixed(1)}%) ---`);
        lines.push(r.content.slice(0, 1000));
        if (r.content.length > 1000) {
          lines.push("...[truncated]");
        }
        lines.push("");
      }

      return lines.join("\n");
    } catch (error) {
      return `Error searching knowledge base: ${error instanceof Error ? error.message : "Unknown error"}`;
    }
  }
}
