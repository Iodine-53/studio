
'use client';

import { useState, useRef, ChangeEvent, useMemo } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { saveAs } from 'file-saver';
import { ArrowLeft, Download, Image as ImageIcon, Loader2, PlusCircle, Trash2, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { ScrollArea } from '@/components/ui/scroll-area';

type OutputFormat = 'image/webp' | 'image/jpeg' | 'image/png';

const Logo = () => (
    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="text-primary">
        <path d="M4 8.5C4 6.567 5.567 5 7.5 5h9c1.933 0 3.5 1.567 3.5 3.5v7c0 1.933-1.567 3.5-3.5 3.5h-9C5.567 19 4 17.433 4 15.5v-7z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        <path d="M9 5v14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
);

type ImageFile = {
  id: string;
  file: File;
  preview: string;
  originalSize: number;
  outputPreview?: string;
  outputSize?: number;
  isConverting?: boolean;
};


export default function ImageConverterPage() {
  const [files, setFiles] = useState<ImageFile[]>([]);
  const [selectedFileId, setSelectedFileId] = useState<string | null>(null);
  const [outputFormat, setOutputFormat] = useState<OutputFormat>('image/png');
  const [quality, setQuality] = useState(80);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const selectedFile = useMemo(() => {
    return files.find(f => f.id === selectedFileId) ?? null;
  }, [files, selectedFileId]);

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const chosenFiles = event.target.files;
    if (!chosenFiles) return;

    if (files.length + chosenFiles.length > 20) {
        toast({
            variant: 'destructive',
            title: 'Upload Limit Exceeded',
            description: 'You can only process up to 20 images at a time.',
        });
        return;
    }

    const newImageFiles: ImageFile[] = [];
    Array.from(chosenFiles).forEach(file => {
        if (!file.type.startsWith('image/')) {
            toast({
              variant: 'destructive',
              title: 'Invalid File Type',
              description: `Skipping "${file.name}" as it is not an image.`,
            });
            return;
        }

        const newFile: ImageFile = {
            id: `${file.name}-${file.lastModified}`,
            file,
            preview: URL.createObjectURL(file),
            originalSize: file.size,
        };
        newImageFiles.push(newFile);
    });

    setFiles(prevFiles => {
        const updatedFiles = [...prevFiles];
        newImageFiles.forEach(nf => {
            if (!updatedFiles.some(f => f.id === nf.id)) {
                updatedFiles.push(nf);
            }
        });
        return updatedFiles;
    });

    if (!selectedFileId && newImageFiles.length > 0) {
        setSelectedFileId(newImageFiles[0].id);
    }

    // Reset file input to allow re-uploading the same file
    if(event.target) event.target.value = "";
  };
  
  const handleDeleteFile = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const remainingFiles = files.filter(f => f.id !== id);
    setFiles(remainingFiles);
    
    if (selectedFileId === id) {
        setSelectedFileId(remainingFiles.length > 0 ? remainingFiles[0].id : null);
    }
  };

  const handleConvert = async () => {
    if (!selectedFile) {
      toast({
        variant: 'destructive',
        title: 'No Image Selected',
        description: 'Please select an image to convert.',
      });
      return;
    }

    setFiles(files => files.map(f => f.id === selectedFile.id ? { ...f, isConverting: true, outputPreview: undefined, outputSize: undefined } : f));

    const img = document.createElement('img');
    img.src = selectedFile.preview;
    
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = img.naturalWidth;
      canvas.height = img.naturalHeight;
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        toast({ variant: 'destructive', title: 'Conversion Error', description: 'Could not get canvas context.' });
        setFiles(files => files.map(f => f.id === selectedFile.id ? { ...f, isConverting: false } : f));
        return;
      }
      
      ctx.drawImage(img, 0, 0);

      const convertedDataUrl = canvas.toDataURL(outputFormat, quality / 100);

      fetch(convertedDataUrl)
        .then(res => res.blob())
        .then(blob => {
            setFiles(files => files.map(f => 
                f.id === selectedFile.id 
                ? { ...f, isConverting: false, outputPreview: convertedDataUrl, outputSize: blob.size } 
                : f
            ));
        });

      toast({
        title: 'Conversion Successful',
        description: `Image converted to ${outputFormat.split('/')[1].toUpperCase()}.`,
      });
    };

    img.onerror = () => {
      toast({ variant: 'destructive', title: 'Image Load Error', description: 'Could not load the selected image.' });
      setFiles(files => files.map(f => f.id === selectedFile.id ? { ...f, isConverting: false } : f));
    };
  };

  const handleDownload = () => {
    if (!selectedFile?.outputPreview) return;
    const extension = outputFormat.split('/')[1];
    const originalName = selectedFile.file.name.split('.').slice(0, -1).join('.');
    saveAs(selectedFile.outputPreview, `${originalName}.${extension}`);
  };
  
  const formatFileSize = (bytes: number | null | undefined) => {
    if (bytes === null || bytes === undefined) return '';
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className="flex flex-col min-h-screen bg-primary/5">
      <header className="flex-shrink-0">
        <div className="container mx-auto px-4 md:px-6 py-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
                <Logo />
                <div>
                    <h1 className="text-2xl font-bold font-headline text-primary">Image Toolkit</h1>
                    <p className="text-muted-foreground text-sm">Convert and compress images right in your browser.</p>
                </div>
            </div>
            <Button variant="outline" asChild>
                <Link href="/">
                    <ArrowLeft className="mr-2" />
                    Back to Home
                </Link>
            </Button>
        </div>
      </header>

      <main className="flex-1 flex flex-col items-center p-4">
        <Card className="w-full max-w-7xl">
          <CardContent className="p-4">
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 min-h-[70vh]">
                
                {/* Image List Column */}
                <div className="lg:col-span-1 bg-muted/30 rounded-lg p-2 flex flex-col">
                    <Button onClick={() => fileInputRef.current?.click()} className="w-full mb-2">
                        <PlusCircle className="mr-2" />
                        Add Images
                    </Button>
                    <input
                        type="file"
                        ref={fileInputRef}
                        onChange={handleFileChange}
                        accept="image/*"
                        className="hidden"
                        multiple
                    />
                    <Label className="text-center text-xs text-muted-foreground pb-2">Up to 20 images</Label>
                    <ScrollArea className="flex-1 -mr-2">
                        {files.length === 0 ? (
                           <div className="flex flex-col items-center justify-center h-full text-center text-muted-foreground p-4 cursor-pointer border-2 border-dashed rounded-lg hover:bg-muted/50 transition-colors"
                             onClick={() => fileInputRef.current?.click()}
                           >
                               <ImageIcon className="h-10 w-10 mb-2" />
                               <p className="font-semibold">Click to add images</p>
                           </div>
                        ) : (
                            <div className="space-y-2 pr-2">
                                {files.map(file => (
                                    <div
                                        key={file.id}
                                        className={cn(
                                            "flex items-center gap-2 p-2 rounded-md border cursor-pointer hover:bg-primary/10 transition-colors",
                                            selectedFileId === file.id ? 'bg-primary/20 border-primary' : 'bg-card'
                                        )}
                                        onClick={() => setSelectedFileId(file.id)}
                                    >
                                        <Image src={file.preview} alt={file.file.name} width={40} height={40} className="rounded-sm object-cover aspect-square"/>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-medium truncate">{file.file.name}</p>
                                            <p className="text-xs text-muted-foreground">{formatFileSize(file.originalSize)}</p>
                                        </div>
                                        <Button variant="ghost" size="icon" className="h-7 w-7 flex-shrink-0" onClick={(e) => handleDeleteFile(file.id, e)}>
                                            <Trash2 className="h-4 w-4 text-destructive"/>
                                        </Button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </ScrollArea>
                </div>
                
                {/* Conversion Workspace Column */}
                <div className="lg:col-span-3 p-4">
                    {!selectedFile ? (
                        <div className="flex flex-col items-center justify-center h-full text-center text-muted-foreground">
                            <ImageIcon className="h-16 w-16 mb-4"/>
                            <h3 className="text-xl font-semibold">Select an image to start</h3>
                            <p>Choose an image from the left panel to begin the conversion process.</p>
                        </div>
                    ) : (
                        <div className="flex flex-col h-full">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 flex-1">
                                <div>
                                    <Label>Original</Label>
                                    <div className="relative aspect-video w-full mt-1 border-2 border-dashed rounded-lg flex items-center justify-center bg-muted/20 overflow-hidden">
                                        <Image src={selectedFile.preview} alt="Input preview" layout="fill" objectFit="contain" />
                                    </div>
                                    <p className="text-sm text-muted-foreground text-center mt-1">Size: {formatFileSize(selectedFile.originalSize)}</p>
                                </div>
                                
                                <div>
                                    <Label>Converted</Label>
                                    <div className="relative aspect-video w-full mt-1 border-2 border-dashed rounded-lg flex items-center justify-center bg-muted/20 overflow-hidden">
                                        {selectedFile.isConverting ? (
                                            <div className="text-center text-muted-foreground">
                                                <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto"/>
                                                <p className="mt-2">Converting...</p>
                                            </div>
                                        ) : selectedFile.outputPreview ? (
                                            <Image src={selectedFile.outputPreview} alt="Output preview" layout="fill" objectFit="contain" />
                                        ) : (
                                            <div className="text-center text-muted-foreground p-4">
                                                <p>Output will appear here</p>
                                            </div>
                                        )}
                                    </div>
                                    {selectedFile.outputSize !== undefined && selectedFile.originalSize !== null && (
                                      <p className="text-sm text-muted-foreground text-center mt-1">
                                        Size: {formatFileSize(selectedFile.outputSize)}
                                        {selectedFile.outputSize && selectedFile.outputSize < selectedFile.originalSize && (
                                          <span className='font-semibold text-green-600'> ({(((selectedFile.originalSize - selectedFile.outputSize)/selectedFile.originalSize)*100).toFixed(0)}% smaller)</span>
                                        )}
                                      </p>
                                    )}
                                </div>
                            </div>

                            <Card className="bg-primary/5 border-primary/20 mt-6">
                              <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6 p-4">
                                <div className="space-y-2">
                                  <Label htmlFor="output-format">Output Format</Label>
                                  <Select value={outputFormat} onValueChange={(value: OutputFormat) => setOutputFormat(value)}>
                                    <SelectTrigger id="output-format"><SelectValue placeholder="Select format" /></SelectTrigger>
                                    <SelectContent>
                                      <SelectItem value="image/png">PNG</SelectItem>
                                      <SelectItem value="image/jpeg">JPEG</SelectItem>
                                      <SelectItem value="image/webp">WEBP</SelectItem>
                                    </SelectContent>
                                  </Select>
                                </div>

                                <div className="space-y-2">
                                  <Label htmlFor="quality">Quality: {quality}%</Label>
                                  <Slider id="quality" min={1} max={100} step={1} value={[quality]} onValueChange={(value) => setQuality(value[0])} disabled={outputFormat === 'image/png'}/>
                                  {outputFormat === 'image/png' && <p className="text-xs text-muted-foreground">PNG is a lossless format; quality slider is disabled.</p>}
                                </div>
                              </CardContent>
                            </Card>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
                                <Button onClick={handleConvert} disabled={selectedFile.isConverting} size="lg">
                                    {selectedFile.isConverting ? <Loader2 className="mr-2 animate-spin" /> : <ArrowRight className="mr-2" />}
                                    Convert Image
                                </Button>
                                <Button onClick={handleDownload} disabled={!selectedFile.outputPreview} size="lg" variant="secondary">
                                    <Download className="mr-2" />
                                    Download Image
                                </Button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
