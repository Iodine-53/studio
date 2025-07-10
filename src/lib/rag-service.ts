
'use server';
/**
 * @fileoverview A client-side service for Retrieval-Augmented Generation (RAG).
 * This service handles chunking text, generating embeddings, and performing
 * similarity searches to find relevant context for AI prompts.
 */

import { genkit, embed } from 'genkit';
import { googleAI } from '@genkit-ai/googleai';

// Define the structure of a chunk with its embedding
interface Chunk {
  text: string;
  embedding: number[];
}

// Simple cosine similarity function
function cosineSimilarity(vecA: number[], vecB: number[]): number {
  if (vecA.length !== vecB.length) {
    return 0;
  }
  
  let dotProduct = 0;
  let normA = 0;
  let normB = 0;
  
  for (let i = 0; i < vecA.length; i++) {
    dotProduct += vecA[i] * vecB[i];
    normA += vecA[i] * vecA[i];
    normB += vecB[i] * vecB[i];
  }

  if (normA === 0 || normB === 0) {
    return 0;
  }
  
  return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
}

// Function to split text into overlapping chunks
function chunkText(text: string, chunkSize = 500, overlap = 100): string[] {
  const chunks: string[] = [];
  if (!text) return chunks;

  for (let i = 0; i < text.length; i += (chunkSize - overlap)) {
    const chunk = text.substring(i, i + chunkSize);
    chunks.push(chunk);
  }
  
  return chunks;
}

export interface RagService {
  indexDocument: (documentText: string) => Promise<void>;
  query: (queryText: string, topK?: number) => Promise<string[]>;
  isIndexed: () => boolean;
}

/**
 * Creates and returns a RAG service instance.
 * @param apiKey The Google AI API key.
 * @returns An object with methods to index and query documents.
 */
export function createRagService(apiKey: string): RagService {
  const runner = genkit({ plugins: [googleAI({ apiKey })] });
  let indexedChunks: Chunk[] = [];

  return {
    /**
     * Indexes a document by chunking it and generating embeddings for each chunk.
     * @param documentText The full text of the document to index.
     */
    async indexDocument(documentText: string): Promise<void> {
      indexedChunks = []; // Clear previous index
      const textChunks = chunkText(documentText);
      
      const embeddingRequests = textChunks.map(chunk => 
        embed({
          embedder: 'googleai/text-embedding-004',
          content: chunk,
          runner,
        })
      );
      
      const embeddings = await Promise.all(embeddingRequests);

      indexedChunks = textChunks.map((chunk, i) => ({
        text: chunk,
        embedding: embeddings[i],
      }));
    },
    
    /**
     * Queries the indexed document to find the most relevant chunks.
     * @param queryText The user's query.
     * @param topK The number of top results to return.
     * @returns A promise that resolves to an array of relevant text chunks.
     */
    async query(queryText: string, topK = 3): Promise<string[]> {
      if (indexedChunks.length === 0) {
        console.warn("Query attempted before indexing a document.");
        return [];
      }
      
      const queryEmbedding = await embed({
        embedder: 'googleai/text-embedding-004',
        content: queryText,
        runner,
      });

      const similarities = indexedChunks.map(chunk => ({
        text: chunk.text,
        similarity: cosineSimilarity(queryEmbedding, chunk.embedding),
      }));

      similarities.sort((a, b) => b.similarity - a.similarity);

      return similarities.slice(0, topK).map(result => result.text);
    },

    /**
     * Checks if a document has been indexed.
     * @returns True if the service has indexed chunks, false otherwise.
     */
    isIndexed(): boolean {
        return indexedChunks.length > 0;
    }
  };
}
