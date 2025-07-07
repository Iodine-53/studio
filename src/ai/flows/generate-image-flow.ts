
'use server';

/**
 * @fileOverview A flow for generating an image from a text prompt.
 * - generateImage - A function that takes a prompt and returns an image data URI.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

export async function generateImage(prompt: string): Promise<string> {
  return generateImageFlow(prompt);
}

const generateImageFlow = ai.defineFlow(
  {
    name: 'generateImageFlow',
    inputSchema: z.string(),
    outputSchema: z.string(),
  },
  async (prompt) => {
    const { media } = await ai.generate({
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

    if (!media) {
      throw new Error('Image generation failed to return media.');
    }

    // The media.url is already a data URI string, e.g., "data:image/png;base64,..."
    return media.url;
  }
);
