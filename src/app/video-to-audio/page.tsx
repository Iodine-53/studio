
'use client';

import { useState, useRef, useCallback } from 'react';
import Link from 'next/link';
import { ArrowLeft, Download, Music, UploadCloud, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { saveAs } from 'file-saver';
import { Mp3Encoder } from 'lamejs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

type OutputFormat = 'wav' | 'mp3';

// Helper: Convert an AudioBuffer to a WAV Blob
function audioBufferToWav(buffer: AudioBuffer): Blob {
    const numOfChan = buffer.numberOfChannels;
    const length = buffer.length * numOfChan * 2 + 44;
    const bufferArray = new ArrayBuffer(length);
    const view = new DataView(bufferArray);
    const channels: Float32Array[] = [];
    let pos = 0;

    const setUint16 = (data: number) => { view.setUint16(pos, data, true); pos += 2; };
    const setUint32 = (data: number) => { view.setUint32(pos, data, true); pos += 4; };

    setUint32(0x46464952); // 'RIFF'
    setUint32(length - 8);
    setUint32(0x45564157); // 'WAVE'
    setUint32(0x20746d66); // 'fmt '
    setUint32(16);
    setUint16(1);
    setUint16(numOfChan);
    setUint32(buffer.sampleRate);
    setUint32(buffer.sampleRate * 2 * numOfChan);
    setUint16(numOfChan * 2);
    setUint16(16);
    setUint32(0x61746164); // 'data'
    setUint32(length - pos - 4);

    for (let i = 0; i < buffer.numberOfChannels; i++) channels.push(buffer.getChannelData(i));

    for (let i = 0; i < buffer.length; i++) {
        for (let j = 0; j < numOfChan; j++) {
            const sample = Math.max(-1, Math.min(1, channels[j][i]));
            view.setInt16(pos, sample < 0 ? sample * 0x8000 : sample * 0x7FFF, true);
            pos += 2;
        }
    }
    return new Blob([view], { type: 'audio/wav' });
}

// Helper: Convert an AudioBuffer to an MP3 Blob
function audioBufferToMp3(buffer: AudioBuffer): Blob {
    const numberOfChannels = buffer.numberOfChannels;
    const sampleRate = buffer.sampleRate;
    const mp3Encoder = new Mp3Encoder(numberOfChannels, sampleRate, 128);
    const mp3Data = [];

    const sampleBlockSize = 1152;
    const dataLength = buffer.length;

    for (let i = 0; i < dataLength; i += sampleBlockSize) {
        const leftChunkFloat = buffer.getChannelData(0).subarray(i, i + sampleBlockSize);
        const leftChunkInt16 = new Int16Array(leftChunkFloat.length);
        for (let j = 0; j < leftChunkFloat.length; j++) {
            leftChunkInt16[j] = leftChunkFloat[j] * 32767.5;
        }

        let rightChunkInt16: Int16Array | undefined = undefined;
        if (numberOfChannels === 2) {
            const rightChunkFloat = buffer.getChannelData(1).subarray(i, i + sampleBlockSize);
            rightChunkInt16 = new Int16Array(rightChunkFloat.length);
            for (let j = 0; j < rightChunkFloat.length; j++) {
                rightChunkInt16[j] = rightChunkFloat[j] * 32767.5;
            }
        }
        
        const mp3buf = mp3Encoder.encodeBuffer(leftChunkInt16, rightChunkInt16);
        if (mp3buf.length > 0) {
            mp3Data.push(mp3buf);
        }
    }
    const mp3buf = mp3Encoder.flush();
    if (mp3buf.length > 0) {
        mp3Data.push(mp3buf);
    }

    return new Blob(mp3Data, { type: 'audio/mp3' });
}


export default function VideoToAudioPage() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [videoSrc, setVideoSrc] = useState<string | null>(null);
  const [audioSrc, setAudioSrc] = useState<string | null>(null);
  const [isConverting, setIsConverting] = useState(false);
  const [progress, setProgress] = useState(0);
  const [progressText, setProgressText] = useState('');
  const [outputFormat, setOutputFormat] = useState<OutputFormat>('mp3');

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

    try {
        setProgress(10);
        setProgressText('Reading video file...');

        const fileBuffer = await selectedFile.arrayBuffer();
        
        setProgress(30);
        setProgressText('Decoding audio track...');

        const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
        const audioBuffer = await audioContext.decodeAudioData(fileBuffer);
        
        setProgress(70);
        setProgressText(`Encoding to ${outputFormat.toUpperCase()}...`);

        let convertedBlob: Blob;
        if (outputFormat === 'mp3') {
          convertedBlob = audioBufferToMp3(audioBuffer);
        } else {
          convertedBlob = audioBufferToWav(audioBuffer);
        }

        const url = URL.createObjectURL(convertedBlob);
        setAudioSrc(url);
        previousAudioURL.current = url;

        setProgress(100);
        setProgressText('Extraction Complete!');
        toast({ title: "Success!", description: "Audio extracted and ready for download." });

    } catch (error) {
        console.error("Conversion error:", error);
        toast({ variant: 'destructive', title: 'Conversion Failed', description: "Could not process this video. The file may be corrupt or in an unsupported format." });
        resetState();
    } finally {
        setIsConverting(false);
    }
  }, [selectedFile, toast, resetState, outputFormat]);
  
  const handleDownload = () => {
    if (audioSrc && selectedFile) {
      const fileName = selectedFile.name.replace(/\.[^/.]+$/, `.${outputFormat}`);
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
                        className={cn(
                            'p-8 text-center border-2 border-dashed rounded-lg cursor-pointer transition-colors',
                            isDragging ? 'border-primary bg-primary/10' : 'border-border hover:border-primary/50 hover:bg-muted/50'
                        )}
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
                                            <SelectItem value="mp3">MP3</SelectItem>
                                            <SelectItem value="wav">WAV</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <Button onClick={convertVideoToAudio} disabled={isConverting} size="lg" className="w-full">
                                    {isConverting ? <Loader2 className="mr-2 animate-spin"/> : <Music className="mr-2" />}
                                    {isConverting ? progressText : 'Extract Audio'}
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
                          <CardHeader>
                            <CardTitle className="text-xl text-center">Extraction Complete!</CardTitle>
                          </CardHeader>
                          <CardContent className="flex flex-col items-center gap-4">
                            <audio src={audioSrc} controls className="w-full"></audio>
                            <Button onClick={handleDownload} size="lg" className="bg-green-600 hover:bg-green-700">
                                <Download className="mr-2" /> Download {outputFormat.toUpperCase()}
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
