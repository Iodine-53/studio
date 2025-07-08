
'use server';

/**
 * @fileOverview A Genkit flow for converting text to speech.
 *
 * - generateAudio - A function that takes a string of text and returns a WAV audio data URI.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import wav from 'wav';
import { googleAI } from '@genkit-ai/googleai';

// The input is a simple string.
const GenerateAudioInputSchema = z.string();

// The output is an object containing the base64-encoded WAV data URI.
const GenerateAudioOutputSchema = z.object({
  media: z.string(),
});
export type GenerateAudioOutput = z.infer<typeof GenerateAudioOutputSchema>;

// Helper function to convert raw PCM audio data to a WAV file buffer.
async function toWav(
  pcmData: Buffer,
  channels = 1,
  rate = 24000,
  sampleWidth = 2
): Promise<string> {
  return new Promise((resolve, reject) => {
    const writer = new wav.Writer({
      channels,
      sampleRate: rate,
      bitDepth: sampleWidth * 8,
    });

    const bufs: Buffer[] = [];
    writer.on('error', reject);
    writer.on('data', (d) => {
      bufs.push(d);
    });
    writer.on('end', () => {
      resolve(Buffer.concat(bufs).toString('base64'));
    });

    writer.write(pcmData);
    writer.end();
  });
}

// Main exported function that the UI will call.
export async function generateAudio(query: string): Promise<GenerateAudioOutput> {
  return generateAudioFlow(query);
}

// The Genkit flow definition.
const generateAudioFlow = ai.defineFlow(
  {
    name: 'generateAudioFlow',
    inputSchema: GenerateAudioInputSchema,
    outputSchema: GenerateAudioOutputSchema,
  },
  async (query) => {
    const isMultiSpeaker = /Speaker\s*\d+:/i.test(query);

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
          prebuiltVoiceConfig: { voiceName: 'Algenib' },
        },
      };
    }
    
    const { media } = await ai.generate({
      model: googleAI.model('gemini-2.5-flash-preview-tts'),
      config: {
        responseModalities: ['AUDIO'],
        speechConfig,
      },
      prompt: query,
    });
    
    if (!media) {
      throw new Error('Audio generation failed. The model returned no content.');
    }
    
    // The model returns audio in PCM format, which needs to be converted to WAV for browser playback.
    const audioBuffer = Buffer.from(media.url.substring(media.url.indexOf(',') + 1), 'base64');
    
    const wavBase64 = await toWav(audioBuffer);

    return {
      media: 'data:audio/wav;base64,' + wavBase64,
    };
  }
);
