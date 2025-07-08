
'use client';

import { useState, useRef, useCallback } from 'react';
import Link from 'next/link';
import { ArrowLeft, Download, Film, Music, UploadCloud, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { saveAs } from 'file-saver';
import lamejs from 'lamejs';

type OutputFormat = 'mp3' | 'wav';

type FileInfo = {
    name: string;
    size: string;
    type: string;
};

export default function VideoToAudioPage() {
    const [videoFile, setVideoFile] = useState<File | null>(null);
    const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
    const [outputFormat, setOutputFormat] = useState<OutputFormat>('mp3');
    const [isProcessing, setIsProcessing] = useState(false);
    const [progress, setProgress] = useState(0);
    const [statusText, setStatusText] = useState('Ready to extract audio from videos!');
    
    const [videoSrc, setVideoSrc] = useState<string | null>(null);
    const [audioSrc, setAudioSrc] = useState<string | null>(null);
    const [videoInfo, setVideoInfo] = useState<FileInfo | null>(null);
    const [audioInfo, setAudioInfo] = useState<FileInfo | null>(null);
    const [isDragging, setIsDragging] = useState(false);

    const fileInputRef = useRef<HTMLInputElement>(null);
    const { toast } = useToast();

    const resetState = () => {
        setVideoFile(null);
        setAudioBlob(null);
        setIsProcessing(false);
        setProgress(0);
        setVideoSrc(null);
        setAudioSrc(null);
        setVideoInfo(null);
        setAudioInfo(null);
        if (fileInputRef.current) fileInputRef.current.value = "";
    };

    const handleFileSelect = (file: File | null) => {
        if (!file) return;
        if (!file.type.startsWith('video/')) {
            toast({ variant: 'destructive', title: 'Invalid File Type', description: 'Please upload a valid video file.' });
            return;
        }
        resetState();
        setVideoFile(file);
        const url = URL.createObjectURL(file);
        setVideoSrc(url);
        setVideoInfo({
            name: file.name,
            size: (file.size / 1024 / 1024).toFixed(2) + ' MB',
            type: file.type,
        });
        extractAudio(file);
    };

    const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(false);
        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            handleFileSelect(e.dataTransfer.files[0]);
        }
    };
    
    const handleDragEvents = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        e.stopPropagation();
        if (e.type === 'dragenter' || e.type === 'dragover') {
            setIsDragging(true);
        } else if (e.type === 'dragleave') {
            setIsDragging(false);
        }
    };

    const formatFileSize = (bytes: number) => {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    };
    
    // --- Core Audio Processing Logic ---

    const extractAudio = useCallback(async (file: File) => {
        setIsProcessing(true);
        setStatusText('Initializing...');
        setProgress(5);

        try {
            const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
            const arrayBuffer = await file.arrayBuffer();

            setStatusText('Decoding audio track...');
            setProgress(25);
            
            const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
            
            setStatusText(`Encoding to ${outputFormat.toUpperCase()}...`);
            setProgress(75);

            let encodedBlob: Blob;
            if (outputFormat === 'mp3') {
                encodedBlob = encodeToMp3(audioBuffer);
            } else { // wav
                encodedBlob = encodeToWav(audioBuffer);
            }

            setAudioBlob(encodedBlob);
            setAudioSrc(URL.createObjectURL(encodedBlob));
            setAudioInfo({
                name: file.name.split('.').slice(0, -1).join('.') + `.${outputFormat}`,
                size: formatFileSize(encodedBlob.size),
                type: encodedBlob.type
            });

            setStatusText('Extraction Complete!');
            toast({ title: "Success!", description: "Audio extracted and ready for download." });
            setProgress(100);

        } catch (err) {
            console.error(err);
            const message = err instanceof Error ? err.message : 'An unknown error occurred.';
            toast({ variant: 'destructive', title: 'Processing Failed', description: 'Could not decode audio. The file might be corrupted or in an unsupported format.' });
            setStatusText('Error: ' + message);
            resetState();
        } finally {
            setIsProcessing(false);
        }

    }, [outputFormat, toast]);

    const encodeToWav = (audioBuffer: AudioBuffer): Blob => {
        const numOfChan = audioBuffer.numberOfChannels;
        const length = audioBuffer.length * numOfChan * 2 + 44;
        const buffer = new ArrayBuffer(length);
        const view = new DataView(buffer);
        const channels = [];
        let i, sample;
        let offset = 0;
        let pos = 0;

        // WAV header
        const setString = (str: string) => {
            for (i = 0; i < str.length; i++) {
                view.setUint8(pos + i, str.charCodeAt(i));
            }
        };

        setString('RIFF'); pos += 4;
        view.setUint32(pos, length - 8, true); pos += 4;
        setString('WAVE'); pos += 4;
        setString('fmt '); pos += 4;
        view.setUint32(pos, 16, true); pos += 4;
        view.setUint16(pos, 1, true); pos += 2;
        view.setUint16(pos, numOfChan, true); pos += 2;
        view.setUint32(pos, audioBuffer.sampleRate, true); pos += 4;
        view.setUint32(pos, audioBuffer.sampleRate * 2 * numOfChan, true); pos += 4;
        view.setUint16(pos, numOfChan * 2, true); pos += 2;
        view.setUint16(pos, 16, true); pos += 2;
        setString('data'); pos += 4;
        view.setUint32(pos, length - pos - 4, true); pos += 4;

        // Write PCM data
        for (i = 0; i < audioBuffer.numberOfChannels; i++) {
            channels.push(audioBuffer.getChannelData(i));
        }

        while (pos < length) {
            for (i = 0; i < numOfChan; i++) {
                sample = Math.max(-1, Math.min(1, channels[i][offset]));
                sample = (0.5 + sample < 0 ? sample * 32768 : sample * 32767) | 0;
                view.setInt16(pos, sample, true);
                pos += 2;
            }
            offset++;
        }

        return new Blob([view], { type: 'audio/wav' });
    };

    const encodeToMp3 = (audioBuffer: AudioBuffer): Blob => {
        const channels = audioBuffer.numberOfChannels;
        const sampleRate = audioBuffer.sampleRate;
        const mp3encoder = new lamejs.Mp3Encoder(channels, sampleRate, 128);
        const mp3Data: Int8Array[] = [];
    
        const sampleBlockSize = 1152;
    
        if (channels === 1) {
            // Mono
            const samples = new Int16Array(audioBuffer.length);
            const pcm = audioBuffer.getChannelData(0);
            for (let i = 0; i < pcm.length; i++) {
                const s = Math.max(-1, Math.min(1, pcm[i]));
                samples[i] = s < 0 ? s * 0x8000 : s * 0x7FFF;
            }
            for (let i = 0; i < samples.length; i += sampleBlockSize) {
                const sampleChunk = samples.subarray(i, i + sampleBlockSize);
                const mp3buf = mp3encoder.encodeBuffer(sampleChunk);
                if (mp3buf.length > 0) {
                    mp3Data.push(mp3buf);
                }
            }
        } else { 
            // Stereo
            const left = new Int16Array(audioBuffer.length);
            const right = new Int16Array(audioBuffer.length);
            const pcmLeft = audioBuffer.getChannelData(0);
            const pcmRight = audioBuffer.getChannelData(1);
            
            for (let i = 0; i < pcmLeft.length; i++) {
                let sL = Math.max(-1, Math.min(1, pcmLeft[i]));
                left[i] = sL < 0 ? sL * 0x8000 : sL * 0x7FFF;

                let sR = Math.max(-1, Math.min(1, pcmRight[i]));
                right[i] = sR < 0 ? sR * 0x8000 : sR * 0x7FFF;
            }

            for (let i = 0; i < left.length; i += sampleBlockSize) {
                const leftChunk = left.subarray(i, i + sampleBlockSize);
                const rightChunk = right.subarray(i, i + sampleBlockSize);
                const mp3buf = mp3encoder.encodeBuffer(leftChunk, rightChunk);
                if (mp3buf.length > 0) {
                    mp3Data.push(mp3buf);
                }
            }
        }

        const mp3buf = mp3encoder.flush();
        if (mp3buf.length > 0) {
            mp3Data.push(mp3buf);
        }
        
        return new Blob(mp3Data, { type: 'audio/mpeg' });
    };

    const handleDownload = () => {
        if (audioBlob && videoFile) {
            const fileName = videoFile.name.split('.').slice(0, -1).join('.') + `.${outputFormat}`;
            saveAs(audioBlob, fileName);
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
                <Card className="w-full max-w-4xl shadow-xl">
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
                            onDrop={handleDrop}
                            onDragOver={handleDragEvents}
                            onDragEnter={handleDragEvents}
                            onDragLeave={handleDragEvents}
                        >
                            <UploadCloud className="h-12 w-12 mx-auto text-muted-foreground mb-2" />
                            <p className="font-semibold">Drop your video here or click to browse</p>
                            <p className="text-sm text-muted-foreground">Supports MP4, WebM, MOV, and more</p>
                            <input
                                ref={fileInputRef}
                                type="file"
                                accept="video/*"
                                className="hidden"
                                onChange={(e) => handleFileSelect(e.target.files?.[0] || null)}
                            />
                        </div>

                        <div className="flex flex-col items-center gap-2">
                           <p className="text-sm font-medium text-muted-foreground">Output Format</p>
                           <ToggleGroup type="single" value={outputFormat} onValueChange={(v: OutputFormat) => v && setOutputFormat(v)} disabled={isProcessing}>
                               <ToggleGroupItem value="mp3">MP3</ToggleGroupItem>
                               <ToggleGroupItem value="wav">WAV</ToggleGroupItem>
                           </ToggleGroup>
                        </div>
                        
                        {isProcessing && (
                            <div className="space-y-2">
                                <div className="flex justify-between items-center text-sm">
                                    <span className="font-medium text-primary flex items-center gap-2">
                                        <Loader2 className="h-4 w-4 animate-spin" />
                                        {statusText}
                                    </span>
                                    <span className="font-mono">{progress.toFixed(0)}%</span>
                                </div>
                                <Progress value={progress} />
                            </div>
                        )}
                        
                        {videoSrc && audioSrc && !isProcessing && (
                           <div className="grid md:grid-cols-2 gap-6">
                                <div className="space-y-4">
                                    <h3 className="text-lg font-semibold flex items-center gap-2"><Film/> Original Video</h3>
                                    <video src={videoSrc} controls className="w-full rounded-lg bg-black"></video>
                                    {videoInfo && <FileInfoDisplay info={videoInfo} />}
                                </div>
                                <div className="space-y-4">
                                    <h3 className="text-lg font-semibold flex items-center gap-2"><Music/> Extracted Audio</h3>
                                    <audio src={audioSrc} controls className="w-full"></audio>
                                    {audioInfo && <FileInfoDisplay info={audioInfo} />}
                                    <Button onClick={handleDownload} className="w-full" size="lg">
                                        <Download className="mr-2 h-5 w-5" /> Download Audio
                                    </Button>
                                </div>
                           </div>
                        )}

                    </CardContent>
                </Card>
            </main>
        </div>
    );
}


function FileInfoDisplay({ info }: { info: FileInfo }) {
    return (
        <Card className="bg-muted/50">
            <CardContent className="p-3 text-sm space-y-1">
                <div className="flex justify-between">
                    <span className="font-medium text-muted-foreground">Name:</span>
                    <span className="truncate text-right ml-2">{info.name}</span>
                </div>
                 <div className="flex justify-between">
                    <span className="font-medium text-muted-foreground">Type:</span>
                    <span>{info.type}</span>
                </div>
                 <div className="flex justify-between">
                    <span className="font-medium text-muted-foreground">Size:</span>
                    <span>{info.size}</span>
                </div>
            </CardContent>
        </Card>
    )
}
