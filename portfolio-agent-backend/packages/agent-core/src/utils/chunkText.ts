import type { Chunk } from "./chunkText.types";

const CHARS_PER_TOKEN = 4;

export function chunkText(
  text: string,
  options?: { maxTokens?: number; overlapTokens?: number },
): Chunk[] {
  const maxTokens = options?.maxTokens ?? 500;
  const overlapTokens = options?.overlapTokens ?? 50;
  const maxChars = maxTokens * CHARS_PER_TOKEN;
  const overlapChars = overlapTokens * CHARS_PER_TOKEN;

  if (text.length <= maxChars) {
    return [
      {
        content: text,
        chunkIndex: 0,
        tokenCount: Math.ceil(text.length / CHARS_PER_TOKEN),
      },
    ];
  }

  const chunks: Chunk[] = [];
  let start = 0;
  let index = 0;

  while (start < text.length) {
    const end = Math.min(start + maxChars, text.length);
    const content = text.slice(start, end);
    chunks.push({
      content,
      chunkIndex: index,
      tokenCount: Math.ceil(content.length / CHARS_PER_TOKEN),
    });
    index++;
    start = end - overlapChars;
    if (start >= text.length) break;
  }

  return chunks;
}
