import { AgentRunner } from "../AgentRunner";
import { OllamaProvider } from "../providers/OllamaProvider";
import { WebSearchTool } from "../tools/WebSearchTool";
import { FetchPageTool } from "../tools/FetchPageTool";
import { RagIngestionTool } from "../tools/RagIngestionTool";
import { RagSearchTool } from "../tools/RagSearchTool";
import { CryptoPriceTool } from "../tools/CryptoPriceTool";
import type { RagRepository } from "@portfolio-agent/db/repositories/RagRepository";

export class ResearchAnalystAgent {
  private runner: AgentRunner;

  constructor(
    private ragRepo: RagRepository,
  ) {
    const ollama = new OllamaProvider();
    const embedFn = (text: string) => ollama.embed(text);

    this.runner = new AgentRunner(
      [
        new CryptoPriceTool(),
        new WebSearchTool(),
        new FetchPageTool(),
        new RagIngestionTool(embedFn, ragRepo),
        new RagSearchTool(embedFn, ragRepo),
      ],
      `You are a Research Analyst Agent for portfolio management. Your role:
- Research assets, markets, and economic trends using web search
- Save important research to the knowledge base for future reference
- Answer questions using both web search and stored knowledge
- Provide concise, evidence-based analysis in Turkish
- Always cite sources when using web search results
- Include risk warnings and disclaimers

Available tools:
- market.cryptoPrice: Get accurate real-time crypto prices from Binance (use for price queries)
- research.webSearch: Search the web for current information
- research.fetchReadablePage: Fetch and read web page content
- rag.ingest: Save page content to the permanent knowledge base
- rag.search: Search previously saved knowledge`,
    );
  }

  async research(query: string): Promise<{ response: string; ingested: boolean }> {
    const response = await this.runner.chat(
      `Research the following topic thoroughly. Use web search, fetch relevant pages, and save important findings to the knowledge base:\n\n${query}`,
    );

    return { response, ingested: true };
  }

  async ask(query: string): Promise<string> {
    return this.runner.chat(query);
  }
}
