
'use server';
/**
 * @fileOverview A server-side flow for Retrieval-Augmented Generation (RAG).
 * This flow handles indexing document text and querying it to find relevant context.
 * It is designed to be called from client components.
 */

import { genkit, embed, ai } from 'genkit';
import { googleAI } from '@genkit-ai/googleai';
import { z } from 'zod';

// Define the structure of a text chunk with its embedding
interface Chunk {
  text: string;
  embedding: number[];
}

// In-memory store for the indexed chunks. In a real app, this might be a persistent vector database.
let indexedChunks: Chunk[] = [];

// Simple cosine similarity function to compare vectors
function cosineSimilarity(vecA: number[], vecB: number[]): number {
  if (vecA.length !== vecB.length) return 0;
  let dotProduct = 0;
  let normA = 0;
  let normB = 0;
  for (let i = 0; i < vecA.length; i++) {
    dotProduct += vecA[i] * vecB[i];
    normA += vecA[i] * vecA[i];
    normB += vecB[i] * vecB[i];
  }
  if (normA === 0 || normB === 0) return 0;
  return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
}

// Function to split text into overlapping chunks
function chunkText(text: string, chunkSize = 500, overlap = 100): string[] {
  const chunks: string[] = [];
  if (!text) return chunks;
  for (let i = 0; i < text.length; i += (chunkSize - overlap)) {
    chunks.push(text.substring(i, i + chunkSize));
  }
  return chunks;
}

// Schema definitions for the RAG flow input
const RagActionSchema = z.enum(['index', 'query']);
const RagFlowInputSchema = z.object({
  action: RagActionSchema,
  apiKey: z.string(),
  documentText: z.string().optional(),
  queryText: z.string().optional(),
  topK: z.number().optional(),
});
export type RagFlowInput = z.infer<typeof RagFlowInputSchema>;

// The output can be either a success message or an array of relevant chunks
const RagFlowOutputSchema = z.union([z.string(), z.array(z.string())]);
export type RagFlowOutput = z.infer<typeof RagFlowOutputSchema>;


/**
 * Main exported function that the UI will call.
 * It acts as a router to the Genkit flow based on the specified action.
 */
export async function performRagAction(input: RagFlowInput): Promise<RagFlowOutput> {
  return ragFlow(input);
}


const ragFlow = ai.defineFlow(
  {
    name: 'ragFlow',
    inputSchema: RagFlowInputSchema,
    outputSchema: RagFlowOutputSchema,
  },
  async (input) => {
    // Initialize a temporary Genkit runner with the user's API key
    const runner = genkit({ plugins: [googleAI({ apiKey: input.apiKey })] });

    if (input.action === 'index') {
      if (!input.documentText) {
        throw new Error('Document text is required for indexing.');
      }
      const textChunks = chunkText(input.documentText);

      // Batch embedding generation for efficiency
      const embeddingRequests = textChunks.map(chunk => 
        runner.embed({
          embedder: 'googleai/text-embedding-004',
          content: chunk,
        })
      );
      const embeddings = await Promise.all(embeddingRequests);
      
      indexedChunks = textChunks.map((chunk, i) => ({
        text: chunk,
        embedding: embeddings[i],
      }));
      
      return 'Indexing complete';

    } else if (input.action === 'query') {
      if (!input.queryText) {
        throw new Error('Query text is required for querying.');
      }
      if (indexedChunks.length === 0) {
        console.warn("Query attempted before indexing a document.");
        return [];
      }

      const queryEmbedding = await runner.embed({
        embedder: 'googleai/text-embedding-004',
        content: input.queryText,
      });

      const similarities = indexedChunks.map(chunk => ({
        text: chunk.text,
        similarity: cosineSimilarity(queryEmbedding, chunk.embedding),
      }));

      similarities.sort((a, b) => b.similarity - a.similarity);

      return similarities.slice(0, input.topK || 3).map(result => result.text);
      
    } else {
      throw new Error('Invalid RAG action specified.');
    }
  }
);
