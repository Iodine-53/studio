
'use server';
/**
 * @fileOverview A Genkit flow for analyzing a document or image provided by the user.
 */

import { ai } from '@/ai/genkit';
import { genkit } from 'genkit';
import { googleAI } from '@genkit-ai/googleai';
import { z } from 'genkit';

const MessageSchema = z.object({
  role: z.enum(['user', 'model']),
  content: z.union([
    z.string(),
    z.array(z.object({
      text: z.string().optional(),
      media: z.object({ url: z.string() }).optional(),
    }))
  ]),
});

const AnalyzeDocumentInputSchema = z.object({
  history: z.array(MessageSchema).describe('The conversation history, where the first user message contains the document context.'),
  apiKey: z.string().optional().describe('Optional API key for Gemini.'),
});
export type AnalyzeDocumentInput = z.infer<typeof AnalyzeDocumentInputSchema>;

const AnalyzeDocumentOutputSchema = z.object({
  response: z.string().describe('The AI response to the prompt.'),
});
export type AnalyzeDocumentOutput = z.infer<typeof AnalyzeDocumentOutputSchema>;

export async function analyzeDocument(input: AnalyzeDocumentInput): Promise<AnalyzeDocumentOutput> {
  return analyzeDocumentFlow(input);
}

const analyzeDocumentFlow = ai.defineFlow(
  {
    name: 'analyzeDocumentFlow',
    inputSchema: AnalyzeDocumentInputSchema,
    outputSchema: AnalyzeDocumentOutputSchema,
  },
  async ({ history, apiKey }) => {
    if (!apiKey) {
      throw new Error("A Gemini API key is required. Please set it in the settings.");
    }
    const runner = genkit({ plugins: [googleAI({ apiKey })] });

    if (history.length === 0) {
      throw new Error("Cannot generate response for an empty history.");
    }
    
    // The context (file) is expected to be in the first message from the user.
    const systemPrompt = `You are an AI assistant helping a user with a document or image they have provided. Your task is to answer the user's questions based on the provided content.

If the input is an image, describe it or answer questions about its content.
If the input is a document, use its text to answer the user's question.

If the answer is not present in the provided content, state that the information is not available. Do not use outside knowledge unless the user explicitly asks for it.
`;

    const lastMessage = history[history.length - 1];
    const historyForModel = history.slice(0, -1);
    
    const response = await runner.generate({
        model: 'googleai/gemini-1.5-flash-latest',
        system: systemPrompt,
        prompt: lastMessage.content,
        history: historyForModel,
    });

    const textResponse = response.text;
    if (!textResponse) {
        throw new Error("AI generation failed. The model returned no content.");
    }

    return { response: textResponse };
  }
);
