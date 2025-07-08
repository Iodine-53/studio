
'use server';
/**
 * @fileOverview A Genkit flow for generating structured progress bar data from a single prompt.
 *
 * - generateProgressBarData - A function that takes a prompt and returns progress bar data.
 * - GenerateProgressBarDataInput - The input type for the generateProgressBarData function.
 * - GenerateProgressBarDataOutput - The return type for the generateProgressBarData function.
 */

import {ai} from '@/ai/genkit';
import {genkit} from 'genkit';
import {googleAI} from '@genkit-ai/googleai';
import {z} from 'genkit';

const ProgressBarDataSchema = z.object({
  id: z.number().describe('A unique identifier for the progress bar.'),
  title: z.string().describe('The label for this progress bar.'),
  progress: z.number().min(0).max(100).describe('The progress percentage, from 0 to 100.'),
  color: z.string().describe('The hex color code for the bar (e.g., "#3B82F6").'),
});

const GenerateProgressBarDataInputSchema = z.object({
  prompt: z.string().describe("The user's request for progress bar content."),
  apiKey: z.string().optional().describe('Optional API key for Gemini.'),
});
export type GenerateProgressBarDataInput = z.infer<typeof GenerateProgressBarDataInputSchema>;

const GenerateProgressBarDataOutputSchema = z.object({
  blockTitle: z.string().describe('A title for the entire block of progress bars.'),
  progressBars: z.array(ProgressBarDataSchema).describe('An array of progress bar objects.'),
});
export type GenerateProgressBarDataOutput = z.infer<typeof GenerateProgressBarDataOutputSchema>;

export async function generateProgressBarData(input: GenerateProgressBarDataInput): Promise<GenerateProgressBarDataOutput> {
  return generateProgressBarDataFlow(input);
}

const generateProgressBarDataFlow = ai.defineFlow(
  {
    name: 'generateProgressBarDataFlow',
    inputSchema: GenerateProgressBarDataInputSchema,
    outputSchema: GenerateProgressBarDataOutputSchema,
  },
  async (input) => {
    const runner = input.apiKey ? genkit({ plugins: [googleAI({ apiKey: input.apiKey })] }) : ai;
    const { output } = await runner.generate({
        model: 'googleai/gemini-2.0-flash',
        prompt: `You are an expert at creating structured data for UI components. Based on the user's prompt, generate a JSON object for a block of progress bars.

        The object must have two keys:
        1. "blockTitle": A string for the overall title of the component.
        2. "progressBars": An array of objects. Each object must have:
          - "id": A unique number, starting from 1.
          - "title": A string label for the bar.
          - "progress": A number between 0 and 100.
          - "color": A hex color string (e.g., "#3B82F6", "#10B981"). Choose from a standard, vibrant color palette.

        Prompt: ${input.prompt}`,
        output: {
            schema: GenerateProgressBarDataOutputSchema
        }
    });
    
    if (!output) {
      throw new Error('AI generation failed. The model returned no content.');
    }
    return output;
  }
);
