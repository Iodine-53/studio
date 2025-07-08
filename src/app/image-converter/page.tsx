
'use client';

import { useState, useRef, ChangeEvent } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { saveAs } from 'file-saver';
import { ArrowLeft, Download, RefreshCw, Image as ImageIcon, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';

type OutputFormat = 'image/webp' | 'image/jpeg' | 'image/png';

const Logo = () => (
    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="text-primary">
        <path d="M4 8.5C4 6.567 5.567 5 7.5 5h9c1.933 0 3.5 1.567 3.5 3.5v7c0 1.933-1.567 3.5-3.5 3.5h-9C5.567 19 4 17.433 4 15.5v-7z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        <path d="M9 5v14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
)

export default function ImageConverterPage() {
  const [inputFile, setInputFile] = useState<File | null>(null);
  const [inputImagePreview, setInputImagePreview] = useState<string | null>(null);
  const [outputImagePreview, setOutputImagePreview] = useState<string | null>(null);
  const [outputFormat, setOutputFormat] = useState<OutputFormat>('image/png');
  const [quality, setQuality] = useState(80);
  const [isConverting, setIsConverting] = useState(false);
  
  const [originalSize, setOriginalSize] = useState<number | null>(null);
  const [outputSize, setOutputSize] = useState<number | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        toast({
          variant: 'destructive',
          title: 'Invalid File Type',
          description: 'Please select an image file.',
        });
        return;
      }
      
      resetState();
      setInputFile(file);
      setOriginalSize(file.size);
      
      const reader = new FileReader();
      reader.onload = (e) => {
        setInputImagePreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };
  
  const resetState = () => {
      setInputFile(null);
      setInputImagePreview(null);
      setOutputImagePreview(null);
      setOriginalSize(null);
      setOutputSize(null);
  }

  const handleConvert = async () => {
    if (!inputFile || !inputImagePreview) {
      toast({
        variant: 'destructive',
        title: 'No Image Selected',
        description: 'Please select an image to convert.',
      });
      return;
    }

    setIsConverting(true);
    setOutputImagePreview(null);
    setOutputSize(null);

    const img = document.createElement('img');
    img.src = inputImagePreview;
    
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = img.naturalWidth;
      canvas.height = img.naturalHeight;
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        toast({ variant: 'destructive', title: 'Conversion Error', description: 'Could not get canvas context.' });
        setIsConverting(false);
        return;
      }
      
      ctx.drawImage(img, 0, 0);

      const convertedDataUrl = canvas.toDataURL(outputFormat, quality / 100);
      setOutputImagePreview(convertedDataUrl);
      
      // Calculate output size
      fetch(convertedDataUrl)
        .then(res => res.blob())
        .then(blob => {
            setOutputSize(blob.size);
        });

      setIsConverting(false);
      toast({
        title: 'Conversion Successful',
        description: `Image converted to ${outputFormat.split('/')[1].toUpperCase()}.`,
      });
    };

    img.onerror = () => {
      toast({ variant: 'destructive', title: 'Image Load Error', description: 'Could not load the selected image.' });
      setIsConverting(false);
    };
  };

  const handleDownload = () => {
    if (!outputImagePreview) return;
    const extension = outputFormat.split('/')[1];
    saveAs(outputImagePreview, `converted-image.${extension}`);
  };
  
  const formatFileSize = (bytes: number | null) => {
    if (bytes === null) return '';
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

      <main className="flex-1 flex flex-col items-center justify-center p-4">
        <Card className="w-full max-w-4xl">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary/10 rounded-md">
                <ImageIcon className="h-6 w-6 text-primary" />
              </div>
              <div>
                <CardTitle>Image Converter</CardTitle>
                <CardDescription>Select an image, choose your desired format and quality, and download the result.</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label>Input Image</Label>
                <div className="relative aspect-video w-full border-2 border-dashed rounded-lg flex items-center justify-center bg-muted/20 overflow-hidden">
                  {inputImagePreview ? (
                    <Image src={inputImagePreview} alt="Input preview" layout="fill" objectFit="contain" />
                  ) : (
                     <div className="text-center text-muted-foreground p-4">
                        <p>Select an image to begin</p>
                    </div>
                  )}
                </div>
                {originalSize && <p className="text-sm text-muted-foreground text-center">Size: {formatFileSize(originalSize)}</p>}
              </div>

              <div className="space-y-2">
                <Label>Output Image</Label>
                <div className="relative aspect-video w-full border-2 border-dashed rounded-lg flex items-center justify-center bg-muted/20 overflow-hidden">
                    {isConverting ? (
                        <div className="text-center text-muted-foreground">
                            <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto"/>
                            <p className="mt-2">Converting...</p>
                        </div>
                    ) : outputImagePreview ? (
                        <Image src={outputImagePreview} alt="Output preview" layout="fill" objectFit="contain" />
                    ) : (
                        <div className="text-center text-muted-foreground p-4">
                            <p>Output will appear here</p>
                        </div>
                    )}
                </div>
                {outputSize !== null && originalSize !== null && (
                  <p className="text-sm text-muted-foreground text-center">
                    Size: {formatFileSize(outputSize)}
                    {outputSize < originalSize && (
                      <span className='font-semibold text-green-600'> ({(((originalSize-outputSize)/originalSize)*100).toFixed(0)}% smaller)</span>
                    )}
                  </p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileChange}
                    accept="image/*"
                    className="hidden"
                />
                <Button variant="outline" onClick={() => fileInputRef.current?.click()}>
                    <RefreshCw className="mr-2" />
                    {inputFile ? 'Change Image' : 'Select Image'}
                </Button>
                <Button onClick={handleDownload} disabled={!outputImagePreview}>
                    <Download className="mr-2" />
                    Download Image
                </Button>
            </div>

            <Card className="bg-primary/5 border-primary/20">
              <CardHeader>
                <CardTitle className="text-lg">Conversion Settings</CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="output-format">Output Format</Label>
                  <Select
                    value={outputFormat}
                    onValueChange={(value: OutputFormat) => setOutputFormat(value)}
                  >
                    <SelectTrigger id="output-format">
                      <SelectValue placeholder="Select format" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="image/png">PNG</SelectItem>
                      <SelectItem value="image/jpeg">JPEG</SelectItem>
                      <SelectItem value="image/webp">WEBP</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="quality">Quality: {quality}%</Label>
                  <Slider
                    id="quality"
                    min={1}
                    max={100}
                    step={1}
                    value={[quality]}
                    onValueChange={(value) => setQuality(value[0])}
                    disabled={outputFormat === 'image/png'}
                  />
                  {outputFormat === 'image/png' && <p className="text-xs text-muted-foreground">PNG is a lossless format; quality slider is disabled.</p>}
                </div>
              </CardContent>
            </Card>

            <Button onClick={handleConvert} disabled={isConverting || !inputFile} size="lg" className="w-full">
              {isConverting ? <Loader2 className="mr-2 animate-spin" /> : <ImageIcon className="mr-2" />}
              Convert Image
            </Button>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
