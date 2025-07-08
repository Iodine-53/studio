'use client';

import { useState, useRef, useCallback, ChangeEvent } from 'react';
import Link from 'next/link';
import { ArrowLeft, Download, Music, UploadCloud, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { saveAs } from 'file-saver';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

// Supported audio formats with MIME types and extensions
const supportedFormats = {
  'audio/webm;codecs=opus': { label: 'WebM (Opus)', extension: '.webm' },
  'audio/mp4;codecs=mp4a.40.2': { label: 'MP4 (AAC)', extension: '.m4a' },
  'audio/ogg;codecs=vorbis': { label: 'OGG (Vorbis)', extension: '.ogg' },
};

type OutputFormat = keyof typeof supportedFormats;

export default function AudioConverterPage() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [audioSrc, setAudioSrc] = useState<string | null>(null);
  const [convertedSrc, setConvertedSrc] = useState<string | null>(null);
  const [isConverting, setIsConverting] = useState(false);
  const [progress, setProgress] = useState(0);
  const [progressText, setProgressText] = useState('');
  const [outputFormat, setOutputFormat] = useState<OutputFormat>('audio/webm;codecs=opus');

  const [isDragging, setIsDragging] = useState(false);
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const audioSrcRef = useRef<string | null>(null);
  const convertedSrcRef = useRef<string | null>(null);

  const cleanupURLs = () => {
    if (audioSrcRef.current) URL.revokeObjectURL(audioSrcRef.current);
    if (convertedSrcRef.current) URL.revokeObjectURL(convertedSrcRef.current);
  };

  const resetState = useCallback(() => {
    cleanupURLs();
    setSelectedFile(null);
    setAudioSrc(null);
    setConvertedSrc(null);
    setIsConverting(false);
    setProgress(0);
    setProgressText('');
    if (fileInputRef.current) fileInputRef.current.value = '';
  }, []);

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0] || null;
    if (!file) return;

    if (!file.type.startsWith('audio/')) {
        toast({ variant: 'destructive', title: 'Invalid File Type', description: 'Please upload a valid audio file.' });
        return;
    }
    resetState();
    setSelectedFile(file);
    const url = URL.createObjectURL(file);
    setAudioSrc(url);
    audioSrcRef.current = url;
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
      const file = e.dataTransfer.files[0];
      if (!file.type.startsWith('audio/')) {
        toast({ variant: 'destructive', title: 'Invalid File Type', description: 'Please upload a valid audio file.' });
        return;
      }
      resetState();
      setSelectedFile(file);
      const url = URL.createObjectURL(file);
      setAudioSrc(url);
      audioSrcRef.current = url;
    }
  };

  const handleConvert = async () => {
    if (!selectedFile) return;

    if (!MediaRecorder.isTypeSupported(outputFormat)) {
      toast({ variant: 'destructive', title: 'Format Not Supported', description: 'Your browser does not support this audio format. Please try another.' });
      return;
    }

    setIsConverting(true);
    if (convertedSrcRef.current) URL.revokeObjectURL(convertedSrcRef.current);
    setConvertedSrc(null);
    setProgress(0);
    setProgressText('Preparing...');

    try {
      setProgress(10);
      setProgressText('Reading file...');
      const fileBuffer = await selectedFile.arrayBuffer();

      setProgress(30);
      setProgressText('Decoding audio...');
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      const audioBuffer = await audioContext.decodeAudioData(fileBuffer);

      const source = audioContext.createBufferSource();
      source.buffer = audioBuffer;

      const destination = audioContext.createMediaStreamDestination();
      source.connect(destination);

      const mediaRecorder = new MediaRecorder(destination.stream, { mimeType: outputFormat });
      const chunks: Blob[] = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) chunks.push(event.data);
      };

      mediaRecorder.onstop = () => {
        const convertedBlob = new Blob(chunks, { type: outputFormat });
        const url = URL.createObjectURL(convertedBlob);
        setConvertedSrc(url);
        convertedSrcRef.current = url;
        setProgress(100);
        setProgressText('Conversion Complete!');
        toast({ title: "Success!", description: `Audio converted successfully.` });
        setIsConverting(false);
        audioContext.close();
      };
      
      mediaRecorder.onerror = (event) => {
        throw new Error(`MediaRecorder error: ${(event as any).error?.name}`);
      };

      setProgress(70);
      setProgressText(`Encoding to ${supportedFormats[outputFormat].label}...`);
      mediaRecorder.start();
      source.start();

      source.onended = () => {
        mediaRecorder.stop();
      };

    } catch (error) {
      console.error("Conversion error:", error);
      toast({ variant: 'destructive', title: 'Conversion Failed', description: error instanceof Error ? error.message : "Could not process this file." });
      resetState();
      setIsConverting(false);
    }
  };

  const handleDownload = () => {
    if (convertedSrc && selectedFile) {
      const { extension } = supportedFormats[outputFormat];
      const fileName = selectedFile.name.replace(/\.[^/.]+$/, extension);
      saveAs(convertedSrc, fileName);
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
                <h1 className="text-xl font-bold font-headline text-primary">Audio Converter</h1>
            </nav>
        </header>
        <main className="flex-1 p-4 sm:p-6 md:p-8 flex items-center justify-center">
            <Card className="w-full max-w-2xl shadow-xl">
                <CardHeader className="text-center">
                    <CardTitle className="text-3xl font-bold font-headline">Convert Audio Files</CardTitle>
                    <CardDescription>Quickly convert your audio files using browser-native APIs.</CardDescription>
                </CardHeader>
                <CardContent className="px-6 pb-8 space-y-6">
                    <div
                        className={cn('p-8 text-center border-2 border-dashed rounded-lg cursor-pointer transition-colors', isDragging ? 'border-primary bg-primary/10' : 'border-border hover:border-primary/50 hover:bg-muted/50')}
                        onClick={() => fileInputRef.current?.click()}
                        onDrop={handleDrop} onDragOver={handleDragEvents} onDragEnter={handleDragEvents} onDragLeave={handleDragEvents}
                    >
                        <UploadCloud className="h-12 w-12 mx-auto text-muted-foreground mb-2" />
                        <p className="font-semibold">Drop your audio file here or click to browse</p>
                        <p className="text-sm text-muted-foreground">Supports MP3, WAV, OGG, and more</p>
                        <input ref={fileInputRef} type="file" accept="audio/*" className="hidden" onChange={handleFileChange} />
                    </div>

                    {selectedFile && (
                        <div className="space-y-4">
                            <h3 className="text-lg font-semibold text-center">Your Audio</h3>
                            <audio src={audioSrc ?? ''} controls className="w-full"></audio>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-end">
                                <div>
                                    <label htmlFor="output-format" className="text-sm font-medium">Output Format</label>
                                     <Select value={outputFormat} onValueChange={(v: OutputFormat) => setOutputFormat(v)}>
                                        <SelectTrigger id="output-format" className="mt-1">
                                            <SelectValue placeholder="Select format" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {Object.entries(supportedFormats).map(([mime, { label }]) => (
                                                <SelectItem key={mime} value={mime} disabled={!MediaRecorder.isTypeSupported(mime)}>{label}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                                <Button onClick={handleConvert} disabled={isConverting} size="lg" className="w-full">
                                    {isConverting ? <Loader2 className="mr-2 animate-spin"/> : <Music className="mr-2" />}
                                    {isConverting ? progressText : 'Convert Audio'}
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

                    {convertedSrc && !isConverting && (
                       <Card className="bg-primary/5 border-primary/20">
                          <CardHeader><CardTitle className="text-xl text-center">Conversion Complete!</CardTitle></CardHeader>
                          <CardContent className="flex flex-col items-center gap-4">
                            <audio src={convertedSrc} controls className="w-full"></audio>
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
