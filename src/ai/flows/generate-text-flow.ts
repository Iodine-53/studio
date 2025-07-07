
'use server';
/**
 * @fileOverview A flow for generating text based on a user prompt.
 * - generateText - A function that takes a prompt and returns generated text.
 */
import { ai } from '@/ai/genkit';
import { z } from 'genkit';

export async function generateText(prompt: string): Promise<string> {
  return generateTextFlow(prompt);
}

const generateTextFlow = ai.defineFlow(
  {
    name: 'generateTextFlow',
    inputSchema: z.string(),
    outputSchema: z.string(),
  },
  async (prompt) => {
    const response = await ai.generate({
      prompt: `You are a helpful AI writing assistant integrated into a document editor.
The user has provided the following prompt. Please provide a thorough and well-structured response.
Fulfill their request, returning only the requested text.
Do not include any preamble, introduction, or extra formatting like Markdown unless specifically asked for.
The generated text should be ready to be inserted directly into their document.

Prompt: "${prompt}"`,
    });
    return response.text ?? '';
  }
);
