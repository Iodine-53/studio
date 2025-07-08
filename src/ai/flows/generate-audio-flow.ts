
'use server';

/**
 * @fileOverview A Genkit flow for converting text to speech.
 *
 * - generateAudio - A function that takes a string of text and returns a WAV audio data URI.
 */

import { ai } from '@/ai/genkit';
import { genkit } from 'genkit';
import { googleAI } from '@genkit-ai/googleai';
import { z } from 'genkit';

// The input is now an object to support an optional API key and voice selection.
const GenerateAudioInputSchema = z.object({
  query: z.string().describe('The text to convert to speech.'),
  apiKey: z.string().optional().describe('Optional API key for Gemini.'),
  voice: z.string().optional().describe('The voice to use for single-speaker generation.'),
});
export type GenerateAudioInput = z.infer<typeof GenerateAudioInputSchema>;


// The output is an object containing the base64-encoded PCM data URI from the model.
const GenerateAudioOutputSchema = z.object({
  pcmDataUri: z.string(),
});
export type GenerateAudioOutput = z.infer<typeof GenerateAudioOutputSchema>;

// Main exported function that the UI will call.
export async function generateAudio(input: GenerateAudioInput): Promise<GenerateAudioOutput> {
  return generateAudioFlow(input);
}

// The Genkit flow definition.
const generateAudioFlow = ai.defineFlow(
  {
    name: 'generateAudioFlow',
    inputSchema: GenerateAudioInputSchema,
    outputSchema: GenerateAudioOutputSchema,
  },
  async ({ query, apiKey, voice }) => {
    if (!apiKey) {
      throw new Error("A Gemini API key is required. Please set it in the settings.");
    }
    const runner = genkit({ plugins: [googleAI({ apiKey })] });
    const isMultiSpeaker = /Speaker\s*\d+:/i.test(query);

    // Normalize whitespace to prevent TTS issues.
    // Replaces tabs with spaces, collapses multiple spaces/newlines, and trims.
    const normalizedQuery = query.replace(/\t/g, ' ').replace(/ +/g, ' ').replace(/\n{2,}/g, '\n').trim();

    let speechConfig: any;
    if (isMultiSpeaker) {
      speechConfig = {
        multiSpeakerVoiceConfig: {
          speakerVoiceConfigs: [
            {
              speaker: 'Speaker1',
              voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Algenib' } },
            },
            {
              speaker: 'Speaker2',
              voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Achernar' } },
            },
          ],
        },
      };
    } else {
      speechConfig = {
        voiceConfig: {
          prebuiltVoiceConfig: { voiceName: voice || 'Algenib' },
        },
      };
    }
    
    const { media } = await runner.generate({
      model: googleAI.model('gemini-2.5-flash-preview-tts'),
      config: {
        responseModalities: ['AUDIO'],
        speechConfig,
      },
      prompt: normalizedQuery,
    });
    
    if (!media) {
      throw new Error('Audio generation failed. The model returned no content.');
    }
    
    // The model returns audio in PCM format. We return the raw data URI to the client.
    return {
      pcmDataUri: media.url,
    };
  }
);
