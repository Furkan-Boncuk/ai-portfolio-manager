import { z } from "zod";

export const webSearchInputSchema = z.object({
  query: z.string().min(1, "Search query is required"),
  maxResults: z.number().int().min(1).max(20).default(5),
});

export const webSearchResultSchema = z.object({
  title: z.string(),
  url: z.string(),
  snippet: z.string(),
});

export type WebSearchInput = z.infer<typeof webSearchInputSchema>;
export type WebSearchResult = z.infer<typeof webSearchResultSchema>;

export interface WebSearchProvider {
  search(input: WebSearchInput): Promise<WebSearchResult[]>;
}

const DDG_INSTANT_API = "https://api.duckduckgo.com/";
const DDG_HTML_API = "https://html.duckduckgo.com/html/";

function extractSnippet(text: string, max = 200): string {
  return text.length > max ? text.slice(0, max) + "..." : text;
}

export class DuckDuckGoSearchProvider implements WebSearchProvider {
  async search(input: WebSearchInput): Promise<WebSearchResult[]> {
    const results = await this.tryInstantAnswer(input);
    if (results.length > 0) return results.slice(0, input.maxResults);

    return this.tryHtmlSearch(input);
  }

  private async tryInstantAnswer(
    input: WebSearchInput,
  ): Promise<WebSearchResult[]> {
    try {
      const url = new URL(DDG_INSTANT_API);
      url.searchParams.set("q", input.query);
      url.searchParams.set("format", "json");
      url.searchParams.set("no_html", "1");
      url.searchParams.set("skip_disambig", "1");

      const res = await fetch(url.toString(), {
        signal: AbortSignal.timeout(5000),
      });
      if (!res.ok) return [];

      const data = (await res.json()) as {
        AbstractText?: string;
        AbstractSource?: string;
        Heading?: string;
        AbstractURL?: string;
      };

      if (data.AbstractText) {
        return [
          {
            title: data.Heading ?? input.query,
            url: data.AbstractURL ?? "",
            snippet: extractSnippet(data.AbstractText),
          },
        ];
      }

      return [];
    } catch {
      return [];
    }
  }

  private async tryHtmlSearch(
    input: WebSearchInput,
  ): Promise<WebSearchResult[]> {
    try {
      const body = new URLSearchParams({ q: input.query });
      const res = await fetch(DDG_HTML_API, {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
          "User-Agent":
            "Mozilla/5.0 (compatible; PortfolioAgent/1.0; +https://github.com/Furkan-Boncuk/ai-portfolio-manager)",
        },
        body: body.toString(),
        signal: AbortSignal.timeout(10000),
      });
      if (!res.ok) return [];

      const html = await res.text();
      return this.parseHtmlResults(html, input.maxResults);
    } catch {
      return [];
    }
  }

  private parseHtmlResults(html: string, max: number): WebSearchResult[] {
    const results: WebSearchResult[] = [];

    const resultRegex =
      /<a[^>]*class="result__a"[^>]*href="([^"]*)"[^>]*>([\s\S]*?)<\/a>[\s\S]*?<a[^>]*class="result__snippet"[^>]*>([\s\S]*?)<\/a>/gi;

    let match: RegExpExecArray | null;
    let count = 0;
    while ((match = resultRegex.exec(html)) !== null && count < max) {
      const url = match[1]?.replace(/\/\/duckduckgo\.com\/l\/\?uddg=/, "") ?? "";
      const title = match[2]?.replace(/<[^>]*>/g, "").trim() ?? "";
      const snippet = match[3]?.replace(/<[^>]*>/g, "").trim() ?? "";

      if (title) {
        results.push({
          title,
          url: decodeURIComponent(url),
          snippet: extractSnippet(snippet),
        });
        count++;
      }
    }

    return results;
  }
}

export class WebSearchTool {
  constructor(
    private provider: WebSearchProvider = new DuckDuckGoSearchProvider(),
  ) {}

  get name(): string {
    return "research.webSearch";
  }

  get description(): string {
    return "Search the web for current information on a given query. Returns title, URL, and snippet for each result.";
  }

  private safeParse(input: unknown): WebSearchInput {
    const parsed = webSearchInputSchema.safeParse(input);
    if (!parsed.success) {
      throw new Error(
        `Invalid web search input: ${parsed.error.message}`,
      );
    }
    return parsed.data;
  }

  async execute(input: unknown): Promise<{
    success: boolean;
    data: WebSearchResult[];
    error?: string;
  }> {
    try {
      const validated = this.safeParse(input);
      const results = await this.provider.search(validated);
      return { success: true, data: results };
    } catch (error) {
      return {
        success: false,
        data: [],
        error: error instanceof Error ? error.message : "Web search failed",
      };
    }
  }
}
