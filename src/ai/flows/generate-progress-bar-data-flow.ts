
'use server';
/**
 * @fileOverview A Genkit flow for generating structured data for a bar chart or progress display.
 *
 * - generateProgressBarData - A function that takes a prompt and returns the chart data.
 * - GenerateProgressBarDataInput - The input type for the function.
 * - GenerateProgressBarDataOutput - The return type for the function.
 */

import {ai} from '@/ai/genkit';
import {genkit} from 'genkit';
import {googleAI} from '@genkit-ai/googleai';
import {z} from 'genkit';

const ItemSchema = z.object({
  id: z.number().describe('A unique identifier for the bar.'),
  label: z.string().describe('The label for this bar.'),
  value: z.number().min(0).max(100).describe('The value (percentage), from 0 to 100.'),
  color: z.string().describe('A hex color code for the bar (e.g., "#3B82F6").'),
});

const GenerateProgressBarDataInputSchema = z.object({
  prompt: z.string().describe("The user's request for the chart content."),
  apiKey: z.string().optional().describe('Optional API key for Gemini.'),
});
export type GenerateProgressBarDataInput = z.infer<typeof GenerateProgressBarDataInputSchema>;

const GenerateProgressBarDataOutputSchema = z.object({
  title: z.string().describe('A title for the entire block of bars.'),
  items: z.array(ItemSchema).describe('An array of bar data objects.'),
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
    if (!input.apiKey) {
      throw new Error("A Gemini API key is required. Please set it in the settings.");
    }
    const runner = genkit({ plugins: [googleAI({ apiKey: input.apiKey })] });
    const { output } = await runner.generate({
        model: 'googleai/gemini-2.0-flash',
        prompt: `You are an expert at creating structured data for UI components. Based on the user's prompt, generate a JSON object for a bar chart or progress display.

        The object must have two keys:
        1. "title": A string for the overall title of the component.
        2. "items": An array of objects. Each object represents a bar and must have:
          - "id": A unique number, starting from 1.
          - "label": A string label for the bar.
          - "value": A number between 0 and 100 representing the percentage.
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
