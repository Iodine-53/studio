
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

const supportedFormats = {
  'audio/mpeg': { label: 'MP3', extension: '.mp3' },
  'audio/wav': { label: 'WAV', extension: '.wav' },
};

type OutputFormat = keyof typeof supportedFormats;

// Helper to encode AudioBuffer to MP3
const encodeToMp3 = (audioBuffer: AudioBuffer): Promise<Blob> => {
    return new Promise((resolve, reject) => {
        try {
            // Polyfill MPEGMode if it's not defined on the window object
            if (typeof (window as any).MPEGMode === 'undefined') {
              (window as any).MPEGMode = {
                STEREO: 0,
                JOINT_STEREO: 1,
                DUAL_CHANNEL: 2,
                MONO: 3,
              };
            }
            const mp3encoder = new lamejs.Mp3Encoder(audioBuffer.numberOfChannels, audioBuffer.sampleRate, 128);
            const mp3Data = [];

            const pcmLeft = audioBuffer.getChannelData(0);
            const pcmRight = audioBuffer.numberOfChannels > 1 ? audioBuffer.getChannelData(1) : pcmLeft;
            const sampleBlockSize = 1152; //
            
            for (let i = 0; i < pcmLeft.length; i += sampleBlockSize) {
                const leftChunk = pcmLeft.subarray(i, i + sampleBlockSize);
                let rightChunk: Float32Array | undefined = undefined;
                if (audioBuffer.numberOfChannels > 1) {
                    rightChunk = pcmRight.subarray(i, i + sampleBlockSize);
                }

                // lamejs requires Int16, so we convert Float32 to Int16
                const leftInt16 = new Int16Array(leftChunk.length);
                for(let j=0; j<leftChunk.length; j++) {
                    leftInt16[j] = leftChunk[j] * 32767;
                }

                let rightInt16: Int16Array | undefined = undefined;
                if (rightChunk) {
                    rightInt16 = new Int16Array(rightChunk.length);
                    for(let j=0; j<rightChunk.length; j++) {
                        rightInt16[j] = rightChunk[j] * 32767;
                    }
                }
                
                const mp3buf = mp3encoder.encodeBuffer(leftInt16, rightInt16);
                if (mp3buf.length > 0) {
                    mp3Data.push(mp3buf);
                }
            }

            const mp3buf = mp3encoder.flush();
            if (mp3buf.length > 0) mp3Data.push(mp3buf);

            resolve(new Blob(mp3Data, { type: 'audio/mpeg' }));
        } catch (error) {
            reject(error);
        }
    });
};

// New, browser-native WAV encoding function
const encodeToWav = (audioBuffer: AudioBuffer): Promise<Blob> => {
    return new Promise((resolve) => {
        const numOfChan = audioBuffer.numberOfChannels;
        const length = audioBuffer.length * numOfChan * 2 + 44;
        const buffer = new ArrayBuffer(length);
        const view = new DataView(buffer);
        const channels = [];
        let i;
        let sample;
        let offset = 0;
        let pos = 0;

        // Helper function to write strings
        const writeString = (view: DataView, offset: number, string: string) => {
            for (let i = 0; i < string.length; i++) {
                view.setUint8(offset + i, string.charCodeAt(i));
            }
        };
        
        // RIFF header
        writeString(view, pos, 'RIFF'); pos += 4;
        view.setUint32(pos, 36 + audioBuffer.length * numOfChan * 2, true); pos += 4;
        writeString(view, pos, 'WAVE'); pos += 4;

        // fmt subchunk
        writeString(view, pos, 'fmt '); pos += 4;
        view.setUint32(pos, 16, true); pos += 4; // Subchunk1Size
        view.setUint16(pos, 1, true); pos += 2; // AudioFormat
        view.setUint16(pos, numOfChan, true); pos += 2; // NumChannels
        view.setUint32(pos, audioBuffer.sampleRate, true); pos += 4; // SampleRate
        view.setUint32(pos, audioBuffer.sampleRate * 2 * numOfChan, true); pos += 4; // ByteRate
        view.setUint16(pos, numOfChan * 2, true); pos += 2; // BlockAlign
        view.setUint16(pos, 16, true); pos += 2; // BitsPerSample

        // data subchunk
        writeString(view, pos, 'data'); pos += 4;
        view.setUint32(pos, audioBuffer.length * numOfChan * 2, true); pos += 4;

        // Write the PCM samples
        for (i = 0; i < audioBuffer.numberOfChannels; i++) {
            channels.push(audioBuffer.getChannelData(i));
        }

        while (pos < length) {
            for (i = 0; i < numOfChan; i++) {
                sample = Math.max(-1, Math.min(1, channels[i][offset])); // clamp
                sample = (0.5 + sample < 0 ? sample * 32768 : sample * 32767) | 0; // scale to 16-bit
                view.setInt16(pos, sample, true); // write the 16-bit sample
                pos += 2;
            }
            offset++;
        }

        resolve(new Blob([view], { type: 'audio/wav' }));
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

    