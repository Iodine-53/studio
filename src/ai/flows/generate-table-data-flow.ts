
'use server';
/**
 * @fileOverview A Genkit flow for generating structured table data from a single prompt.
 *
 * - generateTableData - A function that takes a prompt and returns table headers and rows.
 * - GenerateTableDataOutput - The return type for the generateTableData function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const GenerateTableDataInputSchema = z.object({
  prompt: z.string().describe('The user\'s request for table content.'),
});
export type GenerateTableDataInput = z.infer<typeof GenerateTableDataInputSchema>;

const GenerateTableDataOutputSchema = z.object({
  headers: z.array(z.string()).describe('An array of strings representing the table column headers.'),
  data: z.array(z.array(z.string())).describe('An array of arrays, where each inner array represents a row of table data.'),
});
export type GenerateTableDataOutput = z.infer<typeof GenerateTableDataOutputSchema>;


export async function generateTableData(input: GenerateTableDataInput): Promise<GenerateTableDataOutput> {
  return generateTableDataFlow(input);
}

const generateTableDataPrompt = ai.definePrompt({
    name: 'generateTableDataPrompt',
    input: { schema: GenerateTableDataInputSchema },
    output: { schema: GenerateTableDataOutputSchema },
    prompt: `You are an expert data assistant. Based on the user's prompt, generate a set of table headers and data rows.

You must generate headers and rows that are appropriate for the user's request. The number of items in each data row MUST match the number of items in the headers array.

For example, if the user asks for "a 3-column table comparing fruits", you should generate appropriate headers and rows.

Prompt: {{{prompt}}}
`,
});

const generateTableDataFlow = ai.defineFlow(
  {
    name: 'generateTableDataFlow',
    inputSchema: GenerateTableDataInputSchema,
    outputSchema: GenerateTableDataOutputSchema,
  },
  async (input) => {
    const { output } = await generateTableDataPrompt(input);
    if (!output || !output.headers || output.headers.length === 0 || !output.data) {
      throw new Error('AI generation failed. The model returned no content or an invalid format. Please try rephrasing your prompt.');
    }
    return output;
  }
);
