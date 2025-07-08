
'use server';
/**
 * @fileOverview A Genkit flow for generating structured table data from a single prompt.
 *
 * - generateTableData - A function that takes a prompt and returns table headers and rows.
 * - GenerateTableDataInput - The input type for the generateTableData function.
 * - GenerateTableDataOutput - The return type for the generateTableData function.
 */

import {ai} from '@/ai/genkit';
import {genkit} from 'genkit';
import {googleAI} from '@genkit-ai/googleai';
import {z} from 'genkit';

const GenerateTableDataInputSchema = z.object({
  prompt: z.string().describe("The user's request for table content."),
  apiKey: z.string().optional().describe('Optional API key for Gemini.'),
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


const generateTableDataFlow = ai.defineFlow(
  {
    name: 'generateTableDataFlow',
    inputSchema: GenerateTableDataInputSchema,
    outputSchema: GenerateTableDataOutputSchema, // The final output should still match this schema
  },
  async ({ prompt, apiKey }) => {
    const runner = apiKey ? genkit({ plugins: [googleAI({ apiKey })] }) : ai;
    
    const finalPrompt = `You are an expert data assistant. Based on the user's prompt, generate a JSON object representing table data.

The JSON object MUST have two keys:
1. "headers": an array of strings for the column headers.
2. "data": an array of arrays, where each inner array is a row of string values.

The number of items in each data row MUST EXACTLY match the number of items in the "headers" array.

Do NOT include any markdown formatting like \`\`\`json. Return ONLY the raw JSON object string.

Example prompt: "a 3-column table comparing fruits"
Example output:
{
  "headers": ["Fruit", "Color", "Taste"],
  "data": [
    ["Apple", "Red", "Sweet"],
    ["Banana", "Yellow", "Sweet"],
    ["Lemon", "Yellow", "Sour"]
  ]
}

User Prompt: "${prompt}"
`;

    // Ask the AI for a text response, which should be our JSON string
    const response = await runner.generate({
        prompt: finalPrompt,
    });
    
    const jsonString = response.text?.trim();

    if (!jsonString) {
      throw new Error('AI generation failed. The model returned no content. Please try rephrasing your prompt.');
    }
    
    try {
      // Attempt to parse the string into a JSON object
      const parsedOutput = JSON.parse(jsonString);
      
      // Validate the parsed object against our desired schema
      // This ensures the AI followed instructions correctly
      const validatedOutput = GenerateTableDataOutputSchema.parse(parsedOutput);
      
      return validatedOutput;
      
    } catch (e) {
      console.error("Failed to parse or validate AI's JSON output:", e);
      console.error("AI returned string:", jsonString);
      throw new Error("AI returned data in an invalid format. Please try again.");
    }
  }
);
