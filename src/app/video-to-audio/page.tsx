
'use client';

import { useState, useRef, useCallback, ChangeEvent } from 'react';
import Link from 'next/link';
import { ArrowLeft, Download, Music, UploadCloud, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { saveAs } from 'file-saver';
import * as lamejs from 'lamejs';
import wav from 'wav';

const supportedFormats = {
  'audio/mpeg': { label: 'MP3', extension: '.mp3' },
  'audio/wav': { label: 'WAV', extension: '.wav' },
};

type OutputFormat = keyof typeof supportedFormats;


// Helper to encode AudioBuffer to MP3
const encodeToMp3 = (audioBuffer: AudioBuffer): Promise<Blob> => {
    return new Promise((resolve, reject) => {
        try {
            const mp3encoder = new lamejs.Mp3Encoder(audioBuffer.numberOfChannels, audioBuffer.sampleRate, 128);
            const mp3Data = [];
            const samples = [];
            for (let i = 0; i < audioBuffer.numberOfChannels; i++) {
                samples.push(audioBuffer.getChannelData(i));
            }

            let remainingSamples = samples[0].length;
            const CHUNK_SIZE = 1152;

            for (let i = 0; remainingSamples >= 0; i += CHUNK_SIZE) {
                const leftChunk = samples[0].subarray(i, i + CHUNK_SIZE);
                let rightChunk = audioBuffer.numberOfChannels > 1 ? samples[1].subarray(i, i + CHUNK_SIZE) : new Float32Array(0);

                const leftPCM = new Int16Array(leftChunk.length);
                for (let j = 0; j < leftChunk.length; j++) leftPCM[j] = leftChunk[j] * 32767;

                let rightPCM: Int16Array | undefined;
                if (rightChunk.length > 0) {
                    rightPCM = new Int16Array(rightChunk.length);
                    for (let j = 0; j < rightChunk.length; j++) rightPCM[j] = rightChunk[j] * 32767;
                }

                const mp3buf = mp3encoder.encodeBuffer(leftPCM, rightPCM);
                if (mp3buf.length > 0) mp3Data.push(new Int8Array(mp3buf));
                remainingSamples -= CHUNK_SIZE;
            }

            const mp3buf = mp3encoder.flush();
            if (mp3buf.length > 0) mp3Data.push(new Int8Array(mp3buf));

            resolve(new Blob(mp3Data, { type: 'audio/mpeg' }));
        } catch (error) {
            reject(error);
        }
    });
};


// Helper to encode AudioBuffer to WAV
const encodeToWav = (audioBuffer: AudioBuffer): Promise<Blob> => {
    return new Promise((resolve, reject) => {
        try {
            const numChannels = audioBuffer.numberOfChannels;
            const sampleRate = audioBuffer.sampleRate;
            const format = {
                audioFormat: 1, // PCM
                channels: numChannels,
                sampleRate: sampleRate,
                byteRate: sampleRate * numChannels * 2,
                blockAlign: numChannels * 2,
                bitDepth: 16,
            };

            const pcmData = [];
            const channelData = [];
            for (let i = 0; i < numChannels; i++) {
                channelData.push(audioBuffer.getChannelData(i));
            }

            const interleaved = new Float32Array(audioBuffer.length * numChannels);
            for (let i = 0; i < audioBuffer.length; i++) {
                for (let channel = 0; channel < numChannels; channel++) {
                    interleaved[i * numChannels + channel] = channelData[channel][i];
                }
            }
            
            const dataView = new DataView(new ArrayBuffer(interleaved.length * 2));
            for(let i=0; i < interleaved.length; i++){
                let val = Math.floor(32767 * interleaved[i]);
                val = Math.max(-32768, Math.min(32767, val));
                dataView.setInt16(i * 2, val, true);
            }

            const wavEncoder = new wav.Encoder(format);
            const chunks: any[] = [];
            wavEncoder.on('data', chunk => chunks.push(chunk));
            wavEncoder.on('end', () => resolve(new Blob(chunks, { type: 'audio/wav' })));
            wavEncoder.end(Buffer.from(dataView.buffer));

        } catch (error) {
            reject(error);
        }
    });
};

export default function VideoToAudioPage() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [videoSrc, setVideoSrc] = useState<string | null>(null);
  const [audioSrc, setAudioSrc] = useState<string | null>(null);
  const [isConverting, setIsConverting] = useState(false);
  const [progress, setProgress] = useState(0);
  const [progressText, setProgressText] = useState('');
  const [outputFormat, setOutputFormat] = useState<OutputFormat>('audio/mpeg');

  const [isDragging, setIsDragging] = useState(false);
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const previousVideoURL = useRef<string | null>(null);
  const previousAudioURL = useRef<string | null>(null);

  const resetState = useCallback(() => {
    setSelectedFile(null);
    setVideoSrc(null);
    setAudioSrc(null);
    setIsConverting(false);
    setProgress(0);
    setProgressText('');
    if (fileInputRef.current) fileInputRef.current.value = '';
    if (previousVideoURL.current) URL.revokeObjectURL(previousVideoURL.current);
    if (previousAudioURL.current) URL.revokeObjectURL(previousAudioURL.current);
  }, []);

  const handleFileSelect = (file: File | null) => {
    if (!file) return;
    if (!file.type.startsWith('video/')) {
      toast({ variant: 'destructive', title: 'Invalid File Type', description: 'Please upload a valid video file.' });
      return;
    }
    resetState();
    setSelectedFile(file);
    const url = URL.createObjectURL(file);
    setVideoSrc(url);
    previousVideoURL.current = url;
  };

  const handleDragEvents = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') setIsDragging(true);
    else if (e.type === 'dragleave') setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileSelect(e.dataTransfer.files[0]);
    }
  };

  const convertVideoToAudio = useCallback(async () => {
    if (!selectedFile) {
      toast({ variant: 'destructive', title: 'No File Selected', description: 'Please select a video file first.' });
      return;
    }

    setIsConverting(true);
    setAudioSrc(null);
    if (previousAudioURL.current) URL.revokeObjectURL(previousAudioURL.current);
    setProgress(0);
    
    try {
      setProgress(10);
      setProgressText('Reading file...');
      const fileBuffer = await selectedFile.arrayBuffer();

      setProgress(30);
      setProgressText('Decoding audio...');
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      const audioBuffer = await audioContext.decodeAudioData(fileBuffer);
      
      setProgress(70);
      setProgressText(`Encoding to ${outputFormat.split('/')[1].toUpperCase()}...`);

      let convertedBlob: Blob;
      if (outputFormat === 'audio/mpeg') {
        convertedBlob = await encodeToMp3(audioBuffer);
      } else if (outputFormat === 'audio/wav') {
        convertedBlob = await encodeToWav(audioBuffer);
      } else {
        throw new Error('Unsupported format selected');
      }

      const url = URL.createObjectURL(convertedBlob);
      setAudioSrc(url);
      previousAudioURL.current = url;
      setProgress(100);
      setProgressText('Extraction Complete!');
      toast({ title: 'Success!', description: 'Audio extracted and ready for download.' });

    } catch (error) {
      console.error('Conversion error:', error);
      toast({ variant: 'destructive', title: 'Extraction Failed', description: error instanceof Error ? error.message : "An unknown error occurred." });
      resetState();
    } finally {
        setIsConverting(false);
    }
  }, [selectedFile, outputFormat, toast, resetState]);

  const handleDownload = () => {
    if (audioSrc && selectedFile) {
      const { extension } = supportedFormats[outputFormat];
      const fileName = selectedFile.name.replace(/\.[^/.]+$/, extension);
      saveAs(audioSrc, fileName);
    }
  };

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
                <h1 className="text-xl font-bold font-headline text-primary">Video to Audio Extractor</h1>
            </nav>
        </header>
        <main className="flex-1 p-4 sm:p-6 md:p-8 flex items-center justify-center">
            <Card className="w-full max-w-2xl shadow-xl">
                <CardHeader className="text-center">
                    <CardTitle className="text-3xl font-bold font-headline">Extract Audio From Video</CardTitle>
                    <CardDescription>Fast, secure, and entirely in your browser. No uploads required.</CardDescription>
                </CardHeader>
                <CardContent className="px-6 pb-8 space-y-6">
                    <div
                        className={cn('p-8 text-center border-2 border-dashed rounded-lg cursor-pointer transition-colors', isDragging ? 'border-primary bg-primary/10' : 'border-border hover:border-primary/50 hover:bg-muted/50')}
                        onClick={() => fileInputRef.current?.click()}
                        onDrop={handleDrop} onDragOver={handleDragEvents} onDragEnter={handleDragEvents} onDragLeave={handleDragEvents}
                    >
                        <UploadCloud className="h-12 w-12 mx-auto text-muted-foreground mb-2" />
                        <p className="font-semibold">Drop your video here or click to browse</p>
                        <p className="text-sm text-muted-foreground">Supports MP4, WebM, MOV, and more</p>
                        <input ref={fileInputRef} type="file" accept="video/*" className="hidden" onChange={(e) => handleFileSelect(e.target.files?.[0] || null)} />
                    </div>

                    {selectedFile && (
                        <div className="space-y-4">
                            <h3 className="text-lg font-semibold text-center">Video Preview</h3>
                            <video src={videoSrc ?? ''} controls className="w-full rounded-lg bg-black"></video>
                             <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-end">
                                <div>
                                    <label htmlFor="output-format" className="text-sm font-medium">Output Format</label>
                                    <Select value={outputFormat} onValueChange={(v: OutputFormat) => setOutputFormat(v)}>
                                        <SelectTrigger id="output-format" className="mt-1">
                                            <SelectValue placeholder="Select format" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {Object.entries(supportedFormats).map(([mime, { label }]) => (
                                                <SelectItem key={mime} value={mime}>{label}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                                <Button onClick={convertVideoToAudio} disabled={isConverting} size="lg" className="w-full">
                                    {isConverting ? <Loader2 className="mr-2 animate-spin"/> : <Music className="mr-2" />}
                                    {isConverting ? 'Extracting...' : 'Extract Audio'}
                                </Button>
                             </div>
                        </div>
                    )}

                    {isConverting && (
                        <div className="space-y-2">
                           <Progress value={progress} />
                           <p className="text-sm text-center text-muted-foreground">{progressText}</p>
                        </div>
                    )}

                    {audioSrc && !isConverting && (
                       <Card className="bg-primary/5 border-primary/20">
                          <CardHeader><CardTitle className="text-xl text-center">Extraction Complete!</CardTitle></CardHeader>
                          <CardContent className="flex flex-col items-center gap-4">
                            <audio src={audioSrc} controls className="w-full"></audio>
                            <Button onClick={handleDownload} size="lg" className="bg-green-600 hover:bg-green-700">
                                <Download className="mr-2" /> Download {supportedFormats[outputFormat].label}
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
