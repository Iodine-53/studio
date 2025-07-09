
'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, Voicemail, Loader2, Download, Wand2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/hooks/use-toast';
import { generateAudio } from '@/ai/flows/generate-audio-flow';
import { saveAs } from 'file-saver';
import { useUserApiKey } from '@/hooks/use-user-api-key';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { cn } from '@/lib/utils';
import { Buffer } from 'buffer';

// Polyfill Buffer for client-side usage
if (typeof window !== 'undefined') {
  (window as any).Buffer = Buffer;
}


const VOICES = [
  'Algenib', 'Achernar', 'Enif', 'Hadar', 'Regulus', 'Spica', 'Sirius', 'Vega'
];

const MAX_CHARS = 20000; // Increased overall limit, as we now handle chunking
const CHUNK_SIZE = 4500; // Safe chunk size for each API call

// Helper function to convert raw PCM audio data to a WAV file buffer.
function toWav(
  pcmData: Buffer,
  channels = 1,
  sampleRate = 24000,
  bitDepth = 16
): Buffer {
    const byteRate = sampleRate * channels * (bitDepth / 8);
    const blockAlign = channels * (bitDepth / 8);
    const dataSize = pcmData.length;
    const chunkSize = 36 + dataSize;

    // Total buffer size is 44 bytes for the header + the PCM data size
    const buffer = Buffer.alloc(44 + dataSize);

    let offset = 0;

    // RIFF header
    buffer.write('RIFF', offset); offset += 4;
    buffer.writeUInt32LE(chunkSize, offset); offset += 4;
    buffer.write('WAVE', offset); offset += 4;

    // fmt sub-chunk
    buffer.write('fmt ', offset); offset += 4;
    buffer.writeUInt32LE(16, offset); offset += 4; // Subchunk1Size for PCM
    buffer.writeUInt16LE(1, offset); offset += 2; // AudioFormat (1 for PCM)
    buffer.writeUInt16LE(channels, offset); offset += 2;
    buffer.writeUInt32LE(sampleRate, offset); offset += 4;
    buffer.writeUInt32LE(byteRate, offset); offset += 4;
    buffer.writeUInt16LE(blockAlign, offset); offset += 2;
    buffer.writeUInt16LE(bitDepth, offset); offset += 2;

    // data sub-chunk
    buffer.write('data', offset); offset += 4;
    buffer.writeUInt32LE(dataSize, offset); offset += 4;

    // PCM data
    pcmData.copy(buffer, offset);

    return buffer;
}

// Helper to split text into sentences.
const splitIntoSentences = (text: string): string[] => {
  // This regex splits by sentence-ending punctuation followed by whitespace.
  const sentences = text.match(/[^.!?]+[.!?\s]*/g) || [text];
  return sentences.map(s => s.trim()).filter(s => s.length > 0);
};

// Helper to group sentences into chunks of a maximum size.
const chunkSentences = (sentences: string[], maxChunkSize: number): string[] => {
  const chunks: string[] = [];
  let currentChunk = '';
  for (const sentence of sentences) {
    if (currentChunk.length + sentence.length + 1 > maxChunkSize) {
      if (currentChunk) chunks.push(currentChunk);
      // If a single sentence is too long, it becomes its own chunk.
      currentChunk = sentence;
    } else {
      currentChunk = currentChunk ? `${currentChunk} ${sentence}` : sentence;
    }
  }
  if (currentChunk) chunks.push(currentChunk);
  return chunks;
};


export default function TextToAudioPage() {
  const [inputText, setInputText] = useState(
    'Hello, welcome to ToolboxAI. I can convert this text into natural-sounding speech with different voices. This is a much longer text to demonstrate the new chunking feature. By splitting the text into smaller pieces, we can process very long inputs without causing server timeouts. Each chunk is converted to audio individually, and then all the audio clips are seamlessly stitched together right here in your browser. This makes the tool much more robust and reliable for longer articles, scripts, or documents. Let\'s see how it works!'
  );
  const [isLoading, setIsLoading] = useState(false);
  const [audioSrc, setAudioSrc] = useState<string | null>(null);
  const [selectedVoice, setSelectedVoice] = useState('Algenib');
  const [progress, setProgress] = useState(0);
  const [progressText, setProgressText] = useState('');
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
    setProgress(0);
    setProgressText('Preparing text...');

    try {
      const apiKey = getApiKey() || undefined;
      if (!apiKey) {
        throw new Error("A Gemini API key is required. Please set it in the settings.");
      }
      
      const sentences = splitIntoSentences(inputText);
      const chunks = chunkSentences(sentences, CHUNK_SIZE);
      const totalChunks = chunks.length;
      const allPcmBuffers: Buffer[] = [];
      
      for (let i = 0; i < totalChunks; i++) {
        const chunk = chunks[i];
        const progressPercentage = Math.round(((i + 1) / totalChunks) * 90);
        setProgress(progressPercentage);
        setProgressText(`Generating audio... (Chunk ${i + 1} of ${totalChunks})`);
        
        const isMultiSpeaker = /Speaker\s*\d+:/i.test(chunk);
        const result = await generateAudio({
          query: chunk,
          apiKey,
          voice: isMultiSpeaker ? undefined : selectedVoice,
        });
        
        const pcmBase64 = result.pcmDataUri.substring(result.pcmDataUri.indexOf(',') + 1);
        allPcmBuffers.push(Buffer.from(pcmBase64, 'base64'));
      }
      
      setProgress(95);
      setProgressText('Merging audio clips...');
      await new Promise(resolve => setTimeout(resolve, 50)); // Short delay for UI update

      const mergedPcmBuffer = Buffer.concat(allPcmBuffers);
      const wavBuffer = toWav(mergedPcmBuffer);
      const wavBase64 = wavBuffer.toString('base64');
      const wavDataUri = 'data:audio/wav;base64,' + wavBase64;
      
      setAudioSrc(wavDataUri);
      setProgress(100);
      setProgressText('Generation Complete!');
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
      setProgress(0);
      setProgressText('');
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
              Convert long articles, scripts, or documents into high-quality audio.
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
                    {isLoading ? 'Generating...' : 'Generate Audio'}
                    </Button>
                </div>
            </div>
            
            {isLoading && (
              <div className="pt-4 space-y-2">
                <Progress value={progress} className="w-full" />
                <p className="text-sm text-muted-foreground text-center">{progressText}</p>
              </div>
            )}

            {audioSrc && !isLoading && (
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
