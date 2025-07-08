
'use server';

/**
 * @fileOverview A flow for generating an image from a text prompt.
 * - generateImage - A function that takes a prompt and returns an image data URI.
 */

import { ai } from '@/ai/genkit';
import { genkit } from 'genkit';
import { googleAI } from '@genkit-ai/googleai';
import { z } from 'genkit';

const GenerateImageInputSchema = z.object({
    prompt: z.string().describe('The user prompt for image generation.'),
    apiKey: z.string().optional().describe('Optional API key for Gemini.'),
});
export type GenerateImageInput = z.infer<typeof GenerateImageInputSchema>;


export async function generateImage(input: GenerateImageInput): Promise<string> {
  return generateImageFlow(input);
}

const generateImageFlow = ai.defineFlow(
  {
    name: 'generateImageFlow',
    inputSchema: GenerateImageInputSchema,
    outputSchema: z.string(),
  },
  async ({ prompt, apiKey }) => {
    const runner = apiKey ? genkit({ plugins: [googleAI({ apiKey })] }) : ai;
    const response = await runner.generate({
      model: 'googleai/gemini-2.0-flash-preview-image-generation',
      prompt: prompt,
      config: {
        responseModalities: ['TEXT', 'IMAGE'],
        // Add relaxed safety settings to prevent failures on benign prompts.
        safetySettings: [
          {
            category: 'HARM_CATEGORY_HATE_SPEECH',
            threshold: 'BLOCK_NONE',
          },
          {
            category: 'HARM_CATEGORY_DANGEROUS_CONTENT',
            threshold: 'BLOCK_NONE',
          },
          {
            category: 'HARM_CATEGORY_HARASSMENT',
            threshold: 'BLOCK_NONE',
          },
          {
            category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT',
            threshold: 'BLOCK_NONE',
          },
        ],
      },
    });

    // Check if the generation was blocked by safety filters.
    if (response.candidates && response.candidates.length > 0 && response.candidates[0].finishReason === 'SAFETY') {
      throw new Error('This image could not be generated due to content safety policies. Please change your prompt and try again.');
    }

    const { media } = response;

    if (!media) {
      // This case handles other failures, including when no candidates are returned.
      const finishReason = response.candidates?.[0]?.finishReason;
      if (finishReason === 'SAFETY') {
         throw new Error('This image could not be generated due to content safety policies. Please change your prompt and try again.');
      }
      throw new Error('Image generation failed. The prompt may have been blocked or the service is unavailable. Please try again.');
    }

    // The media.url is already a data URI string, e.g., "data:image/png;base64,..."
    return media.url;
  }
);
