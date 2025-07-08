
'use server';
/**
 * @fileOverview A Genkit flow for generating structured chart data from a single prompt.
 *
 * - generateChartData - A function that takes a prompt and returns an array of data objects.
 * - GenerateChartDataInput - The input type for the generateChartData function.
 * - GenerateChartDataOutput - The return type for the generateChartData function.
 */

import {ai} from '@/ai/genkit';
import {genkit} from 'genkit';
import {googleAI} from '@genkit-ai/googleai';
import {z} from 'genkit';

const GenerateChartDataInputSchema = z.object({
  prompt: z.string().describe("The user's request for chart content."),
  apiKey: z.string().optional().describe('Optional API key for Gemini.'),
});
export type GenerateChartDataInput = z.infer<typeof GenerateChartDataInputSchema>;

// The output is an array of any objects, as the structure will be dynamic.
// We expect something like `[{ "month": "Jan", "sales": 100 }, { "month": "Feb", "sales": 150 }]`
const GenerateChartDataOutputSchema = z.array(z.record(z.any()));
export type GenerateChartDataOutput = z.infer<typeof GenerateChartDataOutputSchema>;

export async function generateChartData(input: GenerateChartDataInput): Promise<GenerateChartDataOutput> {
  return generateChartDataFlow(input);
}

const generateChartDataFlow = ai.defineFlow(
  {
    name: 'generateChartDataFlow',
    inputSchema: GenerateChartDataInputSchema,
    outputSchema: GenerateChartDataOutputSchema,
  },
  async ({ prompt, apiKey }) => {
    if (!apiKey) {
      throw new Error("A Gemini API key is required. Please set it in the settings.");
    }
    const runner = genkit({ plugins: [googleAI({ apiKey })] });
    const finalPrompt = `You are an expert data assistant. Based on the user's prompt, generate a JSON array of objects representing data points for a chart.

Each object in the array is a data point (e.g., a row). Each key-value pair in an object is a data field for that point.
Ensure at least one key has numerical values suitable for a chart's y-axis.

Do NOT include any markdown formatting like \`\`\`json. Return ONLY the raw JSON array string.

Example prompt: "monthly sales for the first quarter"
Example output:
[
  { "month": "January", "sales": 2500, "expenses": 1500 },
  { "month": "February", "sales": 2800, "expenses": 1600 },
  { "month": "March", "sales": 3500, "expenses": 1800 }
]

User Prompt: "${prompt}"
`;

    const response = await runner.generate({
        model: 'googleai/gemini-1.5-pro-latest',
        prompt: finalPrompt,
    });
    
    const jsonString = response.text?.trim();

    if (!jsonString) {
      throw new Error('AI generation failed. The model returned no content. Please try rephrasing your prompt.');
    }
    
    try {
      const parsedOutput = JSON.parse(jsonString);
      const validatedOutput = GenerateChartDataOutputSchema.parse(parsedOutput);
      return validatedOutput;
    } catch (e) {
      console.error("Failed to parse or validate AI's JSON output for chart:", e);
      console.error("AI returned string:", jsonString);
      throw new Error("AI returned data in an invalid format. Please try again.");
    }
  }
);
