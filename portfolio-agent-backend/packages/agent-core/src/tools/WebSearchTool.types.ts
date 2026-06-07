export interface WebSearchProvider {
  search(input: { query: string; maxResults?: number }): Promise<{ title: string; url: string; snippet: string }[]>;
}
