
'use server';

/**
 * @fileOverview This file defines a Genkit flow for brainstorming ideas on a given topic.
 *
 * - brainstormIdeas - A function that takes a topic as input and returns a list of creative ideas.
 * - BrainstormIdeasInput - The input type for the brainstormIdeas function.
 * - BrainstormIdeasOutput - The return type for the brainstormIdeas function.
 */

import {ai} from '@/ai/genkit';
import {genkit} from 'genkit';
import {googleAI} from '@genkit-ai/googleai';
import {z} from 'genkit';

const BrainstormIdeasInputSchema = z.object({
  topic: z.string().describe('The topic for which to generate brainstorming ideas.'),
  apiKey: z.string().optional().describe('Optional API key for Gemini.'),
});
export type BrainstormIdeasInput = z.infer<typeof BrainstormIdeasInputSchema>;

const BrainstormIdeasOutputSchema = z.object({
  ideas: z.array(z.string()).describe('A list of creative ideas for the given topic.'),
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
    
    const { output } = await runner.generate({
        prompt: `You are a creative brainstorming assistant. Generate a list of creative ideas for the following topic:\n\nTopic: ${input.topic}\n\nIdeas:`,
        model: 'googleai/gemini-1.5-pro-latest',
        output: {
            schema: BrainstormIdeasOutputSchema
        }
    });

    if (!output) {
        throw new Error("AI generation failed. The model returned no content.");
    }
    return output;
  }
);
