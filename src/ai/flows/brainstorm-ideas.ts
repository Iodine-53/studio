// 'use server'

/**
 * @fileOverview This file defines a Genkit flow for brainstorming ideas on a given topic.
 *
 * - brainstormIdeas - A function that takes a topic as input and returns a list of creative ideas.
 * - BrainstormIdeasInput - The input type for the brainstormIdeas function.
 * - BrainstormIdeasOutput - The return type for the brainstormIdeas function.
 */

'use server';

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const BrainstormIdeasInputSchema = z.object({
  topic: z.string().describe('The topic for which to generate brainstorming ideas.'),
});
export type BrainstormIdeasInput = z.infer<typeof BrainstormIdeasInputSchema>;

const BrainstormIdeasOutputSchema = z.object({
  ideas: z.array(z.string()).describe('A list of creative ideas for the given topic.'),
});
export type BrainstormIdeasOutput = z.infer<typeof BrainstormIdeasOutputSchema>;

export async function brainstormIdeas(input: BrainstormIdeasInput): Promise<BrainstormIdeasOutput> {
  return brainstormIdeasFlow(input);
}

const brainstormIdeasPrompt = ai.definePrompt({
  name: 'brainstormIdeasPrompt',
  input: {schema: BrainstormIdeasInputSchema},
  output: {schema: BrainstormIdeasOutputSchema},
  prompt: `You are a creative brainstorming assistant. Generate a list of creative ideas for the following topic:\n\nTopic: {{{topic}}}\n\nIdeas:`, // Fixed the typo here
});

const brainstormIdeasFlow = ai.defineFlow(
  {
    name: 'brainstormIdeasFlow',
    inputSchema: BrainstormIdeasInputSchema,
    outputSchema: BrainstormIdeasOutputSchema,
  },
  async input => {
    const {output} = await brainstormIdeasPrompt(input);
    return output!;
  }
);
