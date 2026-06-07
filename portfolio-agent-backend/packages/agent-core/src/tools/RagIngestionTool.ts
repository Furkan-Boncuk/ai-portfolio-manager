import { z } from "zod";
import type { Tool } from "./types";
import type { RagRepository } from "@portfolio-agent/db/repositories/RagRepository";
import { chunkText } from "../utils/chunkText";

export const ragIngestionInputSchema = z.object({
  url: z.string().url("A valid URL is required"),
  title: z.string().min(1).max(500).optional(),
  workspaceId: z.string().uuid(),
  documentType: z.string().min(1).default("web_page"),
  maxChunkTokens: z.number().int().min(100).max(2000).default(500),
});

export type RagIngestionInput = z.infer<typeof ragIngestionInputSchema>;

function estimateTokens(text: string): number {
  return Math.ceil(text.length / 4);
}

export class RagIngestionTool implements Tool {
  constructor(
    private embedFn: (text: string) => Promise<number[]>,
    private ragRepo: RagRepository,
  ) {}

  get definition() {
    return {
      type: "function" as const,
      function: {
        name: "rag.ingest",
        description:
          "Fetch a URL, chunk the content, generate embeddings, and store in the knowledge base for future RAG search. Use this to save research results permanently.",
        parameters: {
          type: "object",
          properties: {
            url: {
              type: "string",
              description: "The URL to fetch and ingest",
            },
            title: {
              type: "string",
              description: "Optional document title (auto-extracted from page if not provided)",
            },
            workspaceId: {
              type: "string",
              description: "Workspace UUID to associate the document with",
            },
            documentType: {
              type: "string",
              description: "Type of document (web_page, article, analysis, report)",
              default: "web_page",
            },
            maxChunkTokens: {
              type: "number",
              description: "Maximum tokens per chunk (100-2000)",
              default: 500,
            },
          },
          required: ["url", "workspaceId"],
        },
      },
    };
  }

  async execute(input: Record<string, unknown>): Promise<string> {
    const parsed = ragIngestionInputSchema.safeParse(input);
    if (!parsed.success) {
      return `Error: Invalid input - ${parsed.error.message}`;
    }

    const { url, workspaceId, documentType, maxChunkTokens } = parsed.data;

    try {
      const pageContent = await this.fetchPage(url);
      if (pageContent.startsWith("Error:")) {
        return pageContent;
      }

      const [firstLine, ...restLines] = pageContent.split("\n");
      const title = parsed.data.title ?? (firstLine?.startsWith("Title:") ? firstLine.slice(7).trim() : url);
      const body = restLines.join("\n").trim();

      const doc = await this.ragRepo.createDocument({
        workspaceId,
        title,
        documentType,
        originalUri: url,
        metadata: { sourceUrl: url, fetchedAt: new Date().toISOString() },
      });

      if (!doc) {
        return "Error: Failed to create document record";
      }

      const chunks = chunkText(body, { maxTokens: maxChunkTokens });

      const chunkInputs = [];
      for (const chunk of chunks) {
        const embedding = await this.embedFn(chunk.content);
        chunkInputs.push({
          documentId: doc.id,
          chunkIndex: chunk.chunkIndex,
          content: chunk.content,
          tokenCount: chunk.tokenCount,
          embedding,
          metadata: { sourceUrl: url },
        });
      }

      await this.ragRepo.createChunks(chunkInputs);

      const totalTokens = estimateTokens(body);

      return [
        `Successfully ingested "${title}"`,
        `  URL: ${url}`,
        `  Document ID: ${doc.id}`,
        `  Total chunks: ${chunks.length}`,
        `  Total tokens: ~${totalTokens}`,
        "",
        "The content is now searchable via the knowledge base.",
      ].join("\n");
    } catch (error) {
      return `Error during ingestion: ${error instanceof Error ? error.message : "Unknown error"}`;
    }
  }

  private async fetchPage(url: string): Promise<string> {
    try {
      const response = await fetch(url, {
        signal: AbortSignal.timeout(15000),
        headers: {
          "User-Agent":
            "Mozilla/5.0 (compatible; PortfolioAgent/1.0; +https://github.com/Furkan-Boncuk/ai-portfolio-manager)",
          Accept: "text/html,application/xhtml+xml",
        },
      });

      if (!response.ok) {
        return `Error: HTTP ${response.status} - ${response.statusText}`;
      }

      const contentType = response.headers.get("content-type") ?? "";
      if (!contentType.includes("text/html") && !contentType.includes("text/plain")) {
        return `Error: Unsupported content type: ${contentType}`;
      }

      const html = await response.text();
      const title = this.extractTitle(html);
      const text = this.stripHtml(html);

      return title ? `Title: ${title}\n\n${text}` : text;
    } catch (error) {
      if (error instanceof Error && error.name === "TimeoutError") {
        return "Error: Request timed out.";
      }
      return `Error: Failed to fetch - ${error instanceof Error ? error.message : "Unknown error"}`;
    }
  }

  private stripHtml(html: string): string {
    return html
      .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, "")
      .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, "")
      .replace(/<nav[^>]*>[\s\S]*?<\/nav>/gi, "")
      .replace(/<footer[^>]*>[\s\S]*?<\/footer>/gi, "")
      .replace(/<header[^>]*>[\s\S]*?<\/header>/gi, "")
      .replace(/<[^>]+>/g, " ")
      .replace(/&nbsp;/g, " ")
      .replace(/&amp;/g, "&")
      .replace(/&lt;/g, "<")
      .replace(/&gt;/g, ">")
      .replace(/&quot;/g, '"')
      .replace(/&#(\d+);/g, (_, c) => String.fromCharCode(Number(c)))
      .replace(/\s+/g, " ")
      .trim();
  }

  private extractTitle(html: string): string {
    const match = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
    if (!match) return "";
    return match[1]?.replace(/<[^>]*>/g, "").trim() ?? "";
  }
}
