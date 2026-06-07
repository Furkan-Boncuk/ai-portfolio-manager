import { z } from "zod";
import type { Tool } from "./types";

export const fetchPageInputSchema = z.object({
  url: z.string().url("A valid URL is required"),
  maxLength: z.number().int().min(100).max(50000).default(10000),
});

export type FetchPageInput = z.infer<typeof fetchPageInputSchema>;

function stripHtml(html: string): string {
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

function extractTitle(html: string): string {
  const match = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
  if (!match) return "";
  return match[1]?.replace(/<[^>]*>/g, "").trim() ?? "";
}

const requestTimestamps: number[] = [];
const RATE_LIMIT_WINDOW = 1000;
const RATE_LIMIT_MAX = 10;

function checkRateLimit(): boolean {
  const now = Date.now();
  while (requestTimestamps.length > 0 && requestTimestamps[0]! < now - RATE_LIMIT_WINDOW) {
    requestTimestamps.shift();
  }
  if (requestTimestamps.length >= RATE_LIMIT_MAX) return false;
  requestTimestamps.push(now);
  return true;
}

export class FetchPageTool implements Tool {
  get definition() {
    return {
      type: "function" as const,
      function: {
        name: "research.fetchReadablePage",
        description:
          "Fetch and extract readable text content from a URL. Returns the page title and main text content as plain text.",
        parameters: {
          type: "object",
          properties: {
            url: {
              type: "string",
              description: "The URL to fetch content from",
            },
            maxLength: {
              type: "number",
              description: "Maximum characters to return (100-50000)",
              default: 10000,
            },
          },
          required: ["url"],
        },
      },
    };
  }

  async execute(input: Record<string, unknown>): Promise<string> {
    const parsed = fetchPageInputSchema.safeParse(input);
    if (!parsed.success) {
      return `Error: Invalid input - ${parsed.error.message}`;
    }

    if (!checkRateLimit()) {
      return "Error: Rate limit exceeded. Too many requests. Please try again later.";
    }

    const { url, maxLength } = parsed.data;

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
        return `Error: Unsupported content type: ${contentType}. Only HTML and text pages are supported.`;
      }

      const html = await response.text();
      const title = extractTitle(html);
      const text = stripHtml(html);

      const result = title ? `Title: ${title}\n\n${text}` : text;
      const truncated = result.length > maxLength
        ? result.slice(0, maxLength) + "\n\n[Content truncated...]"
        : result;

      return truncated || "No readable content found on the page.";
    } catch (error) {
      if (error instanceof Error && error.name === "TimeoutError") {
        return "Error: Request timed out. The page took too long to respond.";
      }
      return `Error: Failed to fetch page - ${error instanceof Error ? error.message : "Unknown error"}`;
    }
  }
}
