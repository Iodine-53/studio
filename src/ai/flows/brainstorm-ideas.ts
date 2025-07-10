
'use server';

/**
 * @fileOverview This file defines a Genkit flow for a general chat interaction with history.
 *
 * - brainstormIdeas - A function that takes a conversation history and returns a text response.
 * - BrainstormIdeasInput - The input type for the function.
 * - BrainstormIdeasOutput - The return type for the function.
 */

import {ai} from '@/ai/genkit';
import {genkit} from 'genkit';
import {googleAI} from '@genkit-ai/googleai';
import {z} from 'genkit';

const MessageSchema = z.object({
  role: z.enum(['user', 'model']),
  content: z.string(),
});

const BrainstormIdeasInputSchema = z.object({
  history: z.array(MessageSchema).describe('The conversation history.'),
  apiKey: z.string().optional().describe('Optional API key for Gemini.'),
  documentContext: z.string().optional().describe('Optional context from the document, pre-filtered for relevance.'),
});
export type BrainstormIdeasInput = z.infer<typeof BrainstormIdeasInputSchema>;

const BrainstormIdeasOutputSchema = z.object({
  response: z.string().describe('The AI response to the prompt.'),
});
export type BrainstormIdeasOutput = z.infer<typeof BrainstormIdeasOutputSchema>;

export async function brainstormIdeas(input: BrainstormIdeasInput): Promise<BrainstormIdeasOutput> {
  return brainstormIdeasFlow(input);
}

const brainstormIdeasFlow = ai.defineFlow(
  {
    name: 'brainstormIdeasFlow',
    inputSchema: BrainstormIdeasInputSchema,
    outputSchema: BrainstormIdeasOutputSchema,
  },
  async ({ history, apiKey, documentContext }) => {
    if (!apiKey) {
      throw new Error("A Gemini API key is required. Please set it in the settings.");
    }
    const runner = genkit({ plugins: [googleAI({ apiKey })] });
    
    if (history.length === 0) {
        throw new Error("Cannot generate response for an empty history.");
    }

    let systemPrompt = "You are a helpful AI assistant for brainstorming and creative writing.";
    
    // If relevant document context is provided, use a more specific system prompt.
    if (documentContext) {
        systemPrompt = `You are an expert writing assistant. The user has provided relevant context from their document.
Use this information as the primary source to answer their questions.
Do not mention that you are using provided context. Simply answer the question.

## Relevant Context
${documentContext}
## End Context
`;
    }

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
