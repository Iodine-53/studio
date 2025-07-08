
'use server';
/**
 * @fileOverview A flow for generating text based on a user prompt.
 * - generateText - A function that takes a prompt and returns generated text.
 */
import { ai } from '@/ai/genkit';
import { genkit } from 'genkit';
import { googleAI } from '@genkit-ai/googleai';
import { z } from 'genkit';

const GenerateTextInputSchema = z.object({
  prompt: z.string().describe('The user prompt for text generation.'),
  apiKey: z.string().optional().describe('Optional API key for Gemini.'),
});
export type GenerateTextInput = z.infer<typeof GenerateTextInputSchema>;

export async function generateText(input: GenerateTextInput): Promise<string> {
  return generateTextFlow(input);
}

const generateTextFlow = ai.defineFlow(
  {
    name: 'generateTextFlow',
    inputSchema: GenerateTextInputSchema,
    outputSchema: z.string(),
  },
  async ({ prompt, apiKey }) => {
    if (!apiKey) {
      throw new Error("A Gemini API key is required. Please set it in the settings.");
    }
    const runner = genkit({ plugins: [googleAI({ apiKey })] });
    const response = await runner.generate({
      model: 'googleai/gemini-1.5-flash-latest',
      prompt: `You are a helpful AI writing assistant integrated into a document editor.
The user has provided the following prompt. Please provide a thorough and well-structured response.
Fulfill their request, returning only the raw text content.
Do not include any preamble, introduction, or markdown formatting like **bold**, *italics*, or lists.
The generated text should be ready to be inserted directly into their document as a single block of plain text.

Prompt: "${prompt}"`,
      config: {
        responseModalities: ['TEXT'], // Ensure only text is returned
      },
    });
    return response.text ?? '';
  }
);
