
'use client';

import { useState, useRef, useCallback } from 'react';
import Link from 'next/link';
import { ArrowLeft, Download, Film, Music, UploadCloud, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { saveAs } from 'file-saver';

type SupportedMimeType = 
  | 'audio/webm;codecs=opus' 
  | 'audio/mp4;codecs=mp4a.40.2' 
  | 'audio/ogg;codecs=vorbis'
  | 'audio/webm;codecs=vorbis';

const MIME_TYPE_MAP: Record<string, string> = {
  'audio/webm;codecs=opus': '.webm',
  'audio/webm;codecs=vorbis': '.webm',
  'audio/mp4;codecs=mp4a.40.2': '.m4a',
  'audio/ogg;codecs=vorbis': '.ogg',
  'audio/webm': '.webm', // Fallback
};

export default function VideoToAudioPage() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [videoSrc, setVideoSrc] = useState<string | null>(null);
  const [audioSrc, setAudioSrc] = useState<string | null>(null);
  const [isConverting, setIsConverting] = useState(false);
  const [progress, setProgress] = useState(0);
  const [selectedFormat, setSelectedFormat] = useState<SupportedMimeType>('audio/webm;codecs=opus');
  const [isDragging, setIsDragging] = useState(false);
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const previousVideoURL = useRef<string | null>(null);
  const previousAudioURL = useRef<string | null>(null);
  const animationFrameId = useRef<number>();

  const resetState = useCallback(() => {
    setSelectedFile(null);
    setVideoSrc(null);
    setAudioSrc(null);
    setIsConverting(false);
    setProgress(0);
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
    setProgress(0);
    setAudioSrc(null);
    if (previousAudioURL.current) URL.revokeObjectURL(previousAudioURL.current);


    try {
      const video = document.createElement('video');
      video.src = URL.createObjectURL(selectedFile);
      video.muted = true;

      await new Promise<void>((resolve, reject) => {
        video.onloadedmetadata = () => resolve();
        video.onerror = () => reject(new Error("Failed to load video metadata. The file may be corrupt."));
      });
      
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      const source = audioContext.createMediaElementSource(video);
      const destination = audioContext.createMediaStreamDestination();
      source.connect(destination);

      const mimeType = MediaRecorder.isTypeSupported(selectedFormat) 
          ? selectedFormat 
          : 'audio/webm;codecs=opus';

      if (!MediaRecorder.isTypeSupported(mimeType)) {
          throw new Error(`Your browser does not support the selected audio format. Please try another.`);
      }

      const mediaRecorder = new MediaRecorder(destination.stream, { mimeType });
      const chunks: Blob[] = [];

      mediaRecorder.ondataavailable = (e) => e.data.size > 0 && chunks.push(e.data);
      
      mediaRecorder.onstop = () => {
        if (animationFrameId.current) cancelAnimationFrame(animationFrameId.current);
        const audioBlob = new Blob(chunks, { type: mimeType });
        const url = URL.createObjectURL(audioBlob);
        setAudioSrc(url);
        previousAudioURL.current = url;
        setIsConverting(false);
        setProgress(100);
        toast({ title: "Success!", description: "Audio extracted and ready for download." });
        audioContext.close();
      };

      mediaRecorder.onerror = (e) => {
          throw new Error("MediaRecorder error: " + (e as any).error.name);
      };
      
      mediaRecorder.start();
      await video.play();

      const updateProgress = () => {
        if (video.duration) {
          const currentProgress = (video.currentTime / video.duration) * 100;
          setProgress(currentProgress);
        }
        if (!video.ended) {
          animationFrameId.current = requestAnimationFrame(updateProgress);
        }
      };
      animationFrameId.current = requestAnimationFrame(updateProgress);

      video.onended = () => {
        mediaRecorder.stop();
      };
    } catch (error) {
        console.error("Conversion error:", error);
        toast({ variant: 'destructive', title: 'Conversion Failed', description: (error as Error).message });
        resetState();
    }
  }, [selectedFile, selectedFormat, toast, resetState]);
  
  const handleDownload = () => {
    if (audioSrc && selectedFile) {
      const extension = MIME_TYPE_MAP[selectedFormat] || '.bin';
      const fileName = selectedFile.name.replace(/\.[^/.]+$/, '') + extension;
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
                                    <label htmlFor="format-select" className="text-sm font-medium text-muted-foreground">Output Format</label>
                                    <Select value={selectedFormat} onValueChange={(v: SupportedMimeType) => setSelectedFormat(v)} disabled={isConverting}>
                                        <SelectTrigger id="format-select"><SelectValue /></SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="audio/webm;codecs=opus">WebM (Opus)</SelectItem>
                                            <SelectItem value="audio/mp4;codecs=mp4a.40.2">MP4 (AAC)</SelectItem>
                                            <SelectItem value="audio/ogg;codecs=vorbis">OGG (Vorbis)</SelectItem>
                                            <SelectItem value="audio/webm;codecs=vorbis">WebM (Vorbis)</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <Button onClick={convertVideoToAudio} disabled={isConverting} size="lg">
                                    {isConverting ? <Loader2 className="mr-2 animate-spin"/> : <Music className="mr-2" />}
                                    {isConverting ? 'Extracting...' : 'Extract Audio'}
                                </Button>
                            </div>
                        </div>
                    )}
                    
                    {isConverting && (
                        <div className="space-y-2">
                           <Progress value={progress} />
                           <p className="text-sm text-center text-muted-foreground">Processing... {Math.round(progress)}%</p>
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
                                <Download className="mr-2" /> Download Audio
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
