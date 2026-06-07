-- HNSW index for vector similarity search on rag_chunks
-- Uses cosine distance (vector_cosine_ops) for embedding similarity
CREATE INDEX IF NOT EXISTS idx_rag_chunks_embedding
  ON rag_chunks
  USING hnsw (embedding vector_cosine_ops);

-- Index for faster document lookups by document_id and chunk_index
CREATE INDEX IF NOT EXISTS idx_rag_chunks_document
  ON rag_chunks (document_id, chunk_index);
