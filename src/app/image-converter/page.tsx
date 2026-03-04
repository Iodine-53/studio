'use client';

import { useState, useRef, ChangeEvent, useMemo } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { saveAs } from 'file-saver';
import JSZip from 'jszip';
import { ArrowLeft, Download, Image as ImageIcon, Loader2, PlusCircle, Trash2, Settings } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Checkbox } from '@/components/ui/checkbox';
import { ApiKeyDialog } from '@/components/ApiKeyDialog';

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
  outputName?: string;
  isConverting?: boolean;
};


export default function ImageConverterPage() {
  const [files, setFiles] = useState<ImageFile[]>([]);
  const [selectedFileId, setSelectedFileId] = useState<string | null>(null);
  const [selectedIds, setSelectedIds] = useState(new Set<string>());
  const [isBatchConverting, setIsBatchConverting] = useState(false);
  const [outputFormat, setOutputFormat] = useState<OutputFormat>('image/png');
  const [quality, setQuality] = useState(80);
  const [isApiDialogOpen, setIsApiDialogOpen] = useState(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const selectedFile = useMemo(() => {
    return files.find(f => f.id === selectedFileId) ?? null;
  }, [files, selectedFileId]);

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const chosenFiles = event.target.files;
    if (!chosenFiles) return;

    if (files.length + chosenFiles.length > 20) {
        toast({ variant: 'destructive', title: 'Upload Limit Exceeded', description: 'You can only process up to 20 images at a time.' });
        return;
    }

    const newImageFiles: ImageFile[] = [];
    Array.from(chosenFiles).forEach(file => {
        if (!file.type.startsWith('image/')) {
            toast({ variant: 'destructive', title: 'Invalid File Type', description: `Skipping "${file.name}" as it is not an image.` });
            return;
        }

        const newFile: ImageFile = {
            id: `${file.name}-${file.lastModified}-${Math.random()}`,
            file,
            preview: URL.createObjectURL(file),
            originalSize: file.size,
        };
        newImageFiles.push(newFile);
    });

    setFiles(prevFiles => {
        const updatedFiles = [...prevFiles];
        newImageFiles.forEach(nf => { if (!updatedFiles.some(f => f.id === nf.id)) { updatedFiles.push(nf); } });
        return updatedFiles;
    });

    if (!selectedFileId && newImageFiles.length > 0) { setSelectedFileId(newImageFiles[0].id); }
    if(event.target) event.target.value = "";
  };
  
  const handleDeleteSingle = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setFiles(files => files.filter(f => f.id !== id));
    setSelectedIds(prev => { const next = new Set(prev); next.delete(id); return next; });
    if (selectedFileId === id) {
      const remainingFiles = files.filter(f => f.id !== id);
      setSelectedFileId(remainingFiles.length > 0 ? remainingFiles[0].id : null);
    }
  };

  const handleDeleteSelected = () => {
    if (selectedIds.size === 0) return;
    setFiles(files => files.filter(f => !selectedIds.has(f.id)));
    if (selectedFileId && selectedIds.has(selectedFileId)) {
      const remainingFiles = files.filter(f => !selectedIds.has(f.id));
      setSelectedFileId(remainingFiles.length > 0 ? remainingFiles[0].id : null);
    }
    setSelectedIds(new Set());
  };

  const performConversion = async (file: ImageFile): Promise<Partial<ImageFile>> => {
      return new Promise((resolve, reject) => {
          const img = document.createElement('img');
          img.src = file.preview;
          img.onload = () => {
              const canvas = document.createElement('canvas');
              canvas.width = img.naturalWidth;
              canvas.height = img.naturalHeight;
              const ctx = canvas.getContext('2d');
              if (!ctx) return reject(new Error('Could not get canvas context.'));
              
              ctx.drawImage(img, 0, 0);

              const convertedDataUrl = canvas.toDataURL(outputFormat, quality / 100);
              const extension = outputFormat.split('/')[1];
              const originalName = file.file.name.split('.').slice(0, -1).join('.');
              
              fetch(convertedDataUrl)
                  .then(res => res.blob())
                  .then(blob => resolve({
                      outputPreview: convertedDataUrl,
                      outputSize: blob.size,
                      outputName: `${originalName}.${extension}`
                  }));
          };
          img.onerror = () => reject(new Error('Could not load the image.'));
      });
  };

  const handleBatchConvert = async (idsToConvert: string[]) => {
    if (idsToConvert.length === 0) {
      toast({ variant: 'destructive', title: 'No Images Selected', description: 'Please select one or more images to convert.' });
      return;
    }
    
    setIsBatchConverting(true);
    setFiles(currentFiles => currentFiles.map(f => idsToConvert.includes(f.id) ? { ...f, isConverting: true, outputPreview: undefined, outputSize: undefined } : f));
    
    const conversionPromises = files
      .filter(f => idsToConvert.includes(f.id))
      .map(async fileToConvert => {
        try {
          const result = await performConversion(fileToConvert);
          return { id: fileToConvert.id, ...result };
        } catch (error) {
          toast({ variant: 'destructive', title: `Failed to convert ${fileToConvert.file.name}`, description: error instanceof Error ? error.message : 'Unknown error' });
          return { id: fileToConvert.id, error: true };
        }
      });

    const results = await Promise.all(conversionPromises);

    setFiles(currentFiles => currentFiles.map(f => {
      const result = results.find(r => r.id === f.id);
      if (result) {
        return { ...f, ...result, isConverting: false };
      }
      return f;
    }));
    
    setIsBatchConverting(false);
    toast({ title: 'Conversion Complete', description: `${results.filter(r => !r.error).length} images converted successfully.` });
  };
  
  const handleDownloadSingle = (file: ImageFile) => {
    if (!file.outputPreview || !file.outputName) return;
    saveAs(file.outputPreview, file.outputName);
  };
  
  const handleDownloadSelected = async () => {
      const filesToDownload = files.filter(f => selectedIds.has(f.id) && f.outputPreview);

      if (filesToDownload.length === 0) {
          toast({ variant: 'destructive', title: 'Nothing to Download', description: 'Select converted files to download.' });
          return;
      }
      
      if (filesToDownload.length === 1) {
          handleDownloadSingle(filesToDownload[0]);
          return;
      }
      
      const zip = new JSZip();
      toast({ title: 'Zipping files...', description: 'Please wait while we prepare your download.' });
      
      for (const file of filesToDownload) {
          if (file.outputPreview && file.outputName) {
              const response = await fetch(file.outputPreview);
              const blob = await response.blob();
              zip.file(file.outputName, blob);
          }
      }
      
      const zipBlob = await zip.generateAsync({ type: 'blob' });
      saveAs(zipBlob, 'converted_images.zip');
  };

  const handleSelectionChange = (id: string, checked: boolean) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (checked) next.add(id);
      else next.delete(id);
      return next;
    });
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedIds(new Set(files.map(f => f.id)));
    } else {
      setSelectedIds(new Set());
    }
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
            <div className="flex items-center gap-2">
                <Button variant="ghost" size="icon" onClick={() => setIsApiDialogOpen(true)} aria-label="Settings">
                    <Settings className="h-5 w-5"/>
                </Button>
                <Button variant="outline" asChild>
                    <Link href="/">
                        <ArrowLeft className="mr-2" />
                        Back to Home
                    </Link>
                </Button>
            </div>
        </div>
      </header>

      <main className="flex-1 flex flex-col items-center p-4">
        <Card className="w-full max-w-7xl">
          <CardContent className="p-4">
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 min-h-[70vh]">
                
                <div className="lg:col-span-1 bg-muted/30 rounded-lg p-2 flex flex-col">
                    <Button onClick={() => fileInputRef.current?.click()} className="w-full mb-2">
                        <PlusCircle className="mr-2" /> Add Images
                    </Button>
                    <input type="file" ref={fileInputRef} onChange={handleFileChange} accept="image/*" className="hidden" multiple />
                    <Label className="text-center text-xs text-muted-foreground pb-2">Up to 20 images</Label>

                    {files.length > 0 && (
                        <div className="flex items-center gap-2 p-2 border-b">
                            <Checkbox id="select-all"
                                checked={selectedIds.size === files.length && files.length > 0}
                                onCheckedChange={(checked) => handleSelectAll(!!checked)}
                            />
                            <label htmlFor="select-all" className="text-sm font-medium">Select All</label>
                        </div>
                    )}
                    
                    <ScrollArea className="flex-1 -mr-2">
                        {files.length === 0 ? (
                           <div className="flex flex-col items-center justify-center h-full text-center text-muted-foreground p-4 cursor-pointer border-2 border-dashed rounded-lg hover:bg-muted/50 transition-colors"
                             onClick={() => fileInputRef.current?.click()}>
                               <ImageIcon className="h-10 w-10 mb-2" />
                               <p className="font-semibold">Click to add images</p>
                           </div>
                        ) : (
                            <div className="space-y-2 pr-2 mt-2">
                                {files.map(file => (
                                    <div key={file.id}
                                        className={cn( "flex items-center gap-2 p-2 rounded-md border cursor-pointer hover:bg-primary/10 transition-colors",
                                            selectedFileId === file.id ? 'bg-primary/20 border-primary' : 'bg-card' )}
                                        onClick={() => setSelectedFileId(file.id)}>
                                        <Checkbox checked={selectedIds.has(file.id)} onCheckedChange={(checked) => handleSelectionChange(file.id, !!checked)} onClick={(e) => e.stopPropagation()}/>
                                        <Image src={file.preview} alt={file.file.name} width={40} height={40} className="rounded-sm object-cover aspect-square"/>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-medium truncate">{file.file.name}</p>
                                            <p className="text-xs text-muted-foreground">{formatFileSize(file.originalSize)}</p>
                                        </div>
                                        {file.outputPreview && <Button variant="ghost" size="icon" className="h-7 w-7 flex-shrink-0" onClick={() => handleDownloadSingle(file)}><Download className="h-4 w-4 text-primary"/></Button>}
                                        <Button variant="ghost" size="icon" className="h-7 w-7 flex-shrink-0" onClick={(e) => handleDeleteSingle(file.id, e)}><Trash2 className="h-4 w-4 text-destructive"/></Button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </ScrollArea>
                </div>
                
                <div className="lg:col-span-3 p-4 flex flex-col">
                    {!selectedFile ? (
                        <div className="flex flex-col items-center justify-center h-full text-center text-muted-foreground">
                            <ImageIcon className="h-16 w-16 mb-4"/>
                            <h3 className="text-xl font-semibold">Select an image to start</h3>
                            <p>Choose an image from the left panel to begin the conversion process.</p>
                        </div>
                    ) : (
                        <>
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
                                        {selectedFile.isConverting || (isBatchConverting && selectedIds.has(selectedFile.id)) ? (
                                            <div className="text-center text-muted-foreground"><Loader2 className="h-8 w-8 animate-spin text-primary mx-auto"/><p className="mt-2">Converting...</p></div>
                                        ) : selectedFile.outputPreview ? (
                                            <Image src={selectedFile.outputPreview} alt="Output preview" layout="fill" objectFit="contain" />
                                        ) : (
                                            <div className="text-center text-muted-foreground p-4"><p>Output will appear here</p></div>
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

                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mt-6">
                                <Button onClick={() => handleBatchConvert(Array.from(selectedIds))} disabled={isBatchConverting || selectedIds.size === 0} size="lg">
                                    {isBatchConverting ? <Loader2 className="mr-2 animate-spin" /> : null}
                                    Convert Selected ({selectedIds.size})
                                </Button>
                                <Button onClick={() => handleBatchConvert(files.map(f => f.id))} disabled={isBatchConverting || files.length === 0} size="lg" variant="secondary">
                                    {isBatchConverting ? <Loader2 className="mr-2 animate-spin" /> : null}
                                    Convert All ({files.length})
                                </Button>
                                <Button onClick={handleDownloadSelected} disabled={selectedIds.size === 0 || files.filter(f => selectedIds.has(f.id) && f.outputPreview).length === 0} size="lg" variant="secondary">
                                    <Download className="mr-2" /> Download Selected
                                </Button>
                                <Button onClick={handleDeleteSelected} disabled={selectedIds.size === 0} size="lg" variant="destructive">
                                    <Trash2 className="mr-2"/> Delete Selected
                                </Button>
                            </div>
                        </>
                    )}
                </div>
            </div>
          </CardContent>
        </Card>
      </main>
      <ApiKeyDialog open={isApiDialogOpen} onOpenChange={setIsApiDialogOpen} />
    </div>
  );
}
