
'use server';

/**
 * @fileOverview This file defines a Genkit flow for a general chat interaction.
 *
 * - brainstormIdeas - A function that takes a prompt and returns a text response.
 * - BrainstormIdeasInput - The input type for the function.
 * - BrainstormIdeasOutput - The return type for the function.
 */

import {ai} from '@/ai/genkit';
import {genkit} from 'genkit';
import {googleAI} from '@genkit-ai/googleai';
import {z} from 'genkit';

const BrainstormIdeasInputSchema = z.object({
  topic: z.string().describe('The user prompt for the chat.'),
  apiKey: z.string().optional().describe('Optional API key for Gemini.'),
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
  async (input) => {
    if (!input.apiKey) {
      throw new Error("A Gemini API key is required. Please set it in the settings.");
    }
    const runner = genkit({ plugins: [googleAI({ apiKey: input.apiKey })] });
    
    const response = await runner.generate({
        prompt: input.topic,
        model: 'googleai/gemini-1.5-flash-latest',
    });

    const textResponse = response.text;
    if (!textResponse) {
        throw new Error("AI generation failed. The model returned no content.");
    }

    return { response: textResponse };
  }
);
