
'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, Voicemail, Loader2, Download, Wand2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { generateAudio } from '@/ai/flows/generate-audio-flow';
import { saveAs } from 'file-saver';
import { useUserApiKey } from '@/hooks/use-user-api-key';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { cn } from '@/lib/utils';
import wav from 'wav';
import { Buffer } from 'buffer';

// Polyfill Buffer for client-side usage
if (typeof window !== 'undefined') {
  (window as any).Buffer = Buffer;
}


const VOICES = [
  'Algenib', 'Achernar', 'Enif', 'Hadar', 'Regulus', 'Spica', 'Sirius', 'Vega'
];

const MAX_CHARS = 5000; // Gemini TTS character limit

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

export default function TextToAudioPage() {
  const [inputText, setInputText] = useState(
    'Hello, welcome to ToolboxAI. I can convert this text into natural-sounding speech with different voices.'
  );
  const [isLoading, setIsLoading] = useState(false);
  const [audioSrc, setAudioSrc] = useState<string | null>(null);
  const [selectedVoice, setSelectedVoice] = useState('Algenib');
  const { toast } = useToast();
  const { getApiKey } = useUserApiKey();

  const handleGenerate = async () => {
    if (!inputText.trim()) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Please enter some text to convert.',
      });
      return;
    }
    
    if (inputText.length > MAX_CHARS) {
        toast({
            variant: 'destructive',
            title: 'Character limit exceeded',
            description: `Please reduce the text to below ${MAX_CHARS} characters.`,
        });
        return;
    }

    setIsLoading(true);
    setAudioSrc(null);
    try {
      const apiKey = getApiKey() || undefined;
      if (!apiKey) {
        throw new Error("A Gemini API key is required. Please set it in the settings.");
      }
      const isMultiSpeaker = /Speaker\s*\d+:/i.test(inputText);
      
      const result = await generateAudio({
        query: inputText,
        apiKey,
        voice: isMultiSpeaker ? undefined : selectedVoice,
      });

      // The flow now returns raw PCM data; we convert it to WAV on the client.
      const pcmBase64 = result.pcmDataUri.substring(result.pcmDataUri.indexOf(',') + 1);
      const pcmBuffer = Buffer.from(pcmBase64, 'base64');
      
      const wavBase64 = await toWav(pcmBuffer);
      const wavDataUri = 'data:audio/wav;base64,' + wavBase64;

      setAudioSrc(wavDataUri);
      toast({
        title: 'Success!',
        description: 'Your audio has been generated.',
      });
    } catch (error) {
      console.error('Text-to-Audio generation failed:', error);
      const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred.';
      toast({
        variant: 'destructive',
        title: 'Generation Failed',
        description: errorMessage,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDownload = () => {
    if (audioSrc) {
      saveAs(audioSrc, 'generated_audio.wav');
    }
  };

  const isMultiSpeaker = /Speaker\s*\d+:/i.test(inputText);
  const isOverLimit = inputText.length > MAX_CHARS;

  return (
    <div className="flex flex-col min-h-screen bg-primary/5">
      <header className="sticky top-0 z-10 flex items-center h-16 px-4 border-b bg-background md:px-6">
        <nav className="flex items-center gap-4 text-lg font-medium md:gap-2 md:text-sm">
          <Button variant="outline" size="icon" className="shrink-0" asChild>
            <Link href="/">
              <ArrowLeft className="h-4 w-4" />
              <span className="sr-only">Back to Home</span>
            </Link>
          </Button>
          <h1 className="text-xl font-bold font-headline text-primary">Text to Audio</h1>
        </nav>
      </header>
      <main className="flex-1 flex flex-col items-center justify-start p-4 sm:p-8">
        <Card className="w-full max-w-2xl shadow-xl">
          <CardHeader className="text-center">
            <Voicemail className="w-12 h-12 mx-auto text-primary" />
            <CardTitle className="text-3xl font-bold font-headline mt-4">AI-Powered Text to Speech</CardTitle>
            <CardDescription>
              Convert text into high-quality audio. Very long texts may take a moment to process.
            </CardDescription>
          </CardHeader>
          <CardContent className="px-6 pb-8 space-y-6">
            <div className="space-y-2">
              <Label htmlFor="tts-input" className="font-semibold">Your Script</Label>
              <Textarea
                id="tts-input"
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                rows={10}
                placeholder="Type or paste your text here..."
                className="text-base"
              />
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>For multiple speakers, use the format: `Speaker1: ...`</span>
                <span className={cn(isOverLimit && 'font-bold text-destructive')}>
                    {inputText.length} / {MAX_CHARS}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
                <div className="md:col-span-1">
                    <Label htmlFor="voice-select">Voice (Single Speaker)</Label>
                    <Select
                        value={selectedVoice}
                        onValueChange={setSelectedVoice}
                        disabled={isMultiSpeaker}
                    >
                        <SelectTrigger id="voice-select" className="mt-1">
                            <SelectValue placeholder="Select voice" />
                        </SelectTrigger>
                        <SelectContent>
                        {VOICES.map(voice => (
                            <SelectItem key={voice} value={voice}>{voice}</SelectItem>
                        ))}
                        </SelectContent>
                    </Select>
                </div>
                <div className="md:col-span-2">
                    <Button onClick={handleGenerate} disabled={isLoading || isOverLimit} className="w-full" size="lg">
                    {isLoading ? (
                        <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    ) : (
                        <Wand2 className="mr-2 h-5 w-5" />
                    )}
                    {isLoading ? 'Generating Audio...' : 'Generate Audio'}
                    </Button>
                </div>
            </div>

            {audioSrc && (
              <Card className="bg-primary/5 border-primary/20">
                <CardHeader>
                  <CardTitle className="text-xl text-center">Your Audio is Ready</CardTitle>
                </CardHeader>
                <CardContent className="flex flex-col items-center gap-4">
                  <audio src={audioSrc} controls className="w-full" />
                  <Button onClick={handleDownload} size="lg" variant="secondary">
                    <Download className="mr-2" /> Download WAV
                  </Button>
                </CardContent>
              </Card>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
