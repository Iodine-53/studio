'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, UploadCloud, Merge, Scissors, Droplets, Loader2, FileText, Download, Settings } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { useToast } from '@/hooks/use-toast';
import { PDFDocument, rgb, degrees, StandardFonts } from 'pdf-lib';
import { saveAs } from 'file-saver';
import { cn } from '@/lib/utils';
import { ApiKeyDialog } from '@/components/ApiKeyDialog';

// Helper function to parse page ranges like "1, 3-5, 8"
const parsePageRanges = (rangeStr: string, totalPages: number): number[] => {
    if (rangeStr.trim().toLowerCase() === 'all') {
      return Array.from({ length: totalPages }, (_, i) => i + 1);
    }
  
    const pages = new Set<number>();
    const parts = rangeStr.split(',');
  
    for (const part of parts) {
      const trimmedPart = part.trim();
      if (trimmedPart.includes('-')) {
        const [start, end] = trimmedPart.split('-').map(Number);
        if (!isNaN(start) && !isNaN(end)) {
          for (let i = start; i <= end; i++) {
            if (i > 0 && i <= totalPages) pages.add(i);
          }
        }
      } else {
        const page = Number(trimmedPart);
        if (!isNaN(page) && page > 0 && page <= totalPages) {
          pages.add(page);
        }
      }
    }
    return Array.from(pages).sort((a, b) => a - b);
};

export default function PdfToolsPage() {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [isApiDialogOpen, setIsApiDialogOpen] = useState(false);
  
  // State for Merge tool
  const [filesToMerge, setFilesToMerge] = useState<File[]>([]);
  
  // State for Split tool
  const [fileToSplit, setFileToSplit] = useState<File | null>(null);
  const [splitRange, setSplitRange] = useState('all');
  const [splitTotalPages, setSplitTotalPages] = useState(0);

  // State for Watermark tool
  const [fileToWatermark, setFileToWatermark] = useState<File | null>(null);
  const [watermarkText, setWatermarkText] = useState('CONFIDENTIAL');
  const [watermarkColor, setWatermarkColor] = useState('#ff0000');
  const [watermarkOpacity, setWatermarkOpacity] = useState(0.5);
  const [watermarkPlacement, setWatermarkPlacement] = useState('diagonal');
  const [watermarkPages, setWatermarkPages] = useState('all');
  const [watermarkTotalPages, setWatermarkTotalPages] = useState(0);

  const handleMergeFilesChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) setFilesToMerge(Array.from(e.target.files));
  };
  
  const handleSplitFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    setFileToSplit(file);
    if (file) {
      const pdfDoc = await PDFDocument.load(await file.arrayBuffer());
      setSplitTotalPages(pdfDoc.getPageCount());
    } else {
      setSplitTotalPages(0);
    }
  };

  const handleWatermarkFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    setFileToWatermark(file);
    if (file) {
      const pdfDoc = await PDFDocument.load(await file.arrayBuffer());
      setWatermarkTotalPages(pdfDoc.getPageCount());
    } else {
      setWatermarkTotalPages(0);
    }
  };

  const handleMerge = async () => {
    if (filesToMerge.length < 2) {
      toast({ variant: 'destructive', title: 'Error', description: 'Please select at least two PDF files to merge.' });
      return;
    }
    setIsLoading(true);
    try {
      const mergedPdf = await PDFDocument.create();
      for (const file of filesToMerge) {
        const pdfBytes = await file.arrayBuffer();
        const pdfDoc = await PDFDocument.load(pdfBytes);
        const copiedPages = await mergedPdf.copyPages(pdfDoc, pdfDoc.getPageIndices());
        copiedPages.forEach((page) => mergedPdf.addPage(page));
      }
      const mergedPdfBytes = await mergedPdf.save();
      saveAs(new Blob([mergedPdfBytes], { type: 'application/pdf' }), 'merged.pdf');
      toast({ title: 'Success', description: 'PDFs merged and downloaded.' });
    } catch (error) {
      toast({ variant: 'destructive', title: 'Merge Failed', description: (error as Error).message });
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleSplit = async () => {
    if (!fileToSplit) {
      toast({ variant: 'destructive', title: 'Error', description: 'Please select a PDF file to split.' });
      return;
    }
    setIsLoading(true);
    try {
      const pagesToKeep = parsePageRanges(splitRange, splitTotalPages);
      if (pagesToKeep.length === 0) throw new Error('No valid pages selected for splitting.');

      const pdfBytes = await fileToSplit.arrayBuffer();
      const pdfDoc = await PDFDocument.load(pdfBytes);
      const newPdf = await PDFDocument.create();
      
      const copiedPages = await newPdf.copyPages(pdfDoc, pagesToKeep.map(p => p - 1));
      copiedPages.forEach((page) => newPdf.addPage(page));
      
      const newPdfBytes = await newPdf.save();
      saveAs(new Blob([newPdfBytes], { type: 'application/pdf' }), 'split.pdf');
      toast({ title: 'Success', description: 'PDF split and downloaded.' });
    } catch (error) {
      toast({ variant: 'destructive', title: 'Split Failed', description: (error as Error).message });
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleWatermark = async () => {
    if (!fileToWatermark) {
      toast({ variant: 'destructive', title: 'Error', description: 'Please select a PDF file to watermark.' });
      return;
    }
    setIsLoading(true);
    try {
        const pagesToWatermark = parsePageRanges(watermarkPages, watermarkTotalPages);
        if (pagesToWatermark.length === 0) throw new Error('No valid pages selected for watermarking.');

        const pdfBytes = await fileToWatermark.arrayBuffer();
        const pdfDoc = await PDFDocument.load(pdfBytes);
        const font = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
        
        const { r, g, b } = {
            r: parseInt(watermarkColor.slice(1, 3), 16) / 255,
            g: parseInt(watermarkColor.slice(3, 5), 16) / 255,
            b: parseInt(watermarkColor.slice(5, 7), 16) / 255,
        };

        for (const pageNum of pagesToWatermark) {
            const page = pdfDoc.getPage(pageNum - 1);
            const { width, height } = page.getSize();
            const textSize = Math.min(width, height) / 10;
            const textWidth = font.widthOfTextAtSize(watermarkText, textSize);

            let options = {};
            if (watermarkPlacement === 'diagonal') {
                options = {
                    x: width / 2 - textWidth / 2,
                    y: height / 2,
                    font,
                    size: textSize,
                    color: rgb(r, g, b),
                    opacity: watermarkOpacity,
                    rotate: degrees(45),
                };
            } else {
                let y;
                if (watermarkPlacement === 'top') y = height - textSize - 50;
                else if (watermarkPlacement === 'bottom') y = 50;
                else y = height / 2; // Center
                options = {
                    x: width / 2 - textWidth / 2,
                    y,
                    font,
                    size: textSize,
                    color: rgb(r, g, b),
                    opacity: watermarkOpacity,
                };
            }
            page.drawText(watermarkText, options);
        }

        const newPdfBytes = await pdfDoc.save();
        saveAs(new Blob([newPdfBytes], { type: 'application/pdf' }), 'watermarked.pdf');
        toast({ title: 'Success', description: 'PDF watermarked and downloaded.' });
    } catch (error) {
        toast({ variant: 'destructive', title: 'Watermark Failed', description: (error as Error).message });
    } finally {
        setIsLoading(false);
    }
  };

  const ToolContent = ({ icon, title, description, children }: { icon: React.ReactNode, title: string, description: string, children: React.ReactNode }) => (
    <Card className="max-w-3xl w-full">
        <CardHeader>
            <div className="flex items-center gap-4">
                {icon}
                <div>
                    <CardTitle className="text-2xl font-headline">{title}</CardTitle>
                    <p className="text-muted-foreground">{description}</p>
                </div>
            </div>
        </CardHeader>
        <CardContent className="space-y-6 pt-6">
            {children}
        </CardContent>
    </Card>
  );

  const FileUploadArea = ({ id, onFileChange, file, multiple = false, totalPages = 0 }: { id: string, onFileChange: any, file: File | File[] | null, multiple?: boolean, totalPages?: number }) => (
    <div className="space-y-2">
        <Label htmlFor={id}>Upload PDF(s)</Label>
        <div className="p-4 border-2 border-dashed rounded-lg text-center">
            <Button type="button" variant="link" className="text-lg" onClick={() => document.getElementById(id)?.click()}>
                <UploadCloud className="mr-2 h-6 w-6" /> Click to select files
            </Button>
            <Input id={id} type="file" accept="application/pdf" className="hidden" onChange={onFileChange} multiple={multiple} />
            {file && (
                <div className="mt-2 text-sm text-muted-foreground">
                    {Array.isArray(file) ? (
                        <p>{file.length} file(s) selected.</p>
                    ) : (
                        <p>Selected: {file.name} ({totalPages} pages)</p>
                    )}
                </div>
            )}
        </div>
    </div>
  );

  return (
    <div className="flex flex-col min-h-screen bg-primary/5">
      <header className="sticky top-0 z-10 flex items-center justify-between h-16 px-4 border-b bg-background md:px-6">
        <nav className="flex items-center gap-4 text-lg font-medium md:gap-2 md:text-sm">
          <Button variant="outline" size="icon" className="shrink-0" asChild>
            <Link href="/">
              <ArrowLeft className="h-4 w-4" />
              <span className="sr-only">Back to Home</span>
            </Link>
          </Button>
          <h1 className="text-xl font-bold font-headline text-primary">PDF Toolkit</h1>
        </nav>
        <Button variant="ghost" size="icon" onClick={() => setIsApiDialogOpen(true)} aria-label="Settings">
            <Settings className="h-5 w-5"/>
        </Button>
      </header>
      <main className="flex-1 flex flex-col items-center justify-start p-4 sm:p-8">
        <Tabs defaultValue="merge" className="w-full max-w-3xl">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="merge"><Merge className="mr-2" />Merge</TabsTrigger>
            <TabsTrigger value="split"><Scissors className="mr-2" />Split</TabsTrigger>
            <TabsTrigger value="watermark"><Droplets className="mr-2" />Watermark</TabsTrigger>
          </TabsList>
          
          <TabsContent value="merge" className="mt-6">
            <ToolContent icon={<Merge className="h-10 w-10 text-primary" />} title="Merge PDFs" description="Combine multiple PDF files into a single document.">
                <FileUploadArea id="merge-upload" onFileChange={handleMergeFilesChange} file={filesToMerge} multiple />
                <Button onClick={handleMerge} disabled={isLoading || filesToMerge.length < 2} className="w-full" size="lg">
                    {isLoading ? <Loader2 className="animate-spin mr-2" /> : <Merge className="mr-2" />}
                    Merge & Download
                </Button>
            </ToolContent>
          </TabsContent>
          
          <TabsContent value="split" className="mt-6">
            <ToolContent icon={<Scissors className="h-10 w-10 text-primary" />} title="Split PDF" description="Extract specific pages or ranges from a PDF file.">
                <FileUploadArea id="split-upload" onFileChange={handleSplitFileChange} file={fileToSplit} totalPages={splitTotalPages} />
                <div className="space-y-2">
                    <Label htmlFor="split-range">Pages to Extract</Label>
                    <Input id="split-range" value={splitRange} onChange={(e) => setSplitRange(e.target.value)} placeholder='e.g., "1-3, 5, 8-10" or "all"' />
                    <p className="text-xs text-muted-foreground">Enter page numbers or ranges, separated by commas.</p>
                </div>
                <Button onClick={handleSplit} disabled={isLoading || !fileToSplit} className="w-full" size="lg">
                    {isLoading ? <Loader2 className="animate-spin mr-2" /> : <Scissors className="mr-2" />}
                    Split & Download
                </Button>
            </ToolContent>
          </TabsContent>

          <TabsContent value="watermark" className="mt-6">
            <ToolContent icon={<Droplets className="h-10 w-10 text-primary" />} title="Add Watermark" description="Apply a text watermark to your PDF pages.">
                <FileUploadArea id="watermark-upload" onFileChange={handleWatermarkFileChange} file={fileToWatermark} totalPages={watermarkTotalPages}/>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <Label htmlFor="watermark-text">Watermark Text</Label>
                        <Input id="watermark-text" value={watermarkText} onChange={e => setWatermarkText(e.target.value)} />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="watermark-color">Text Color</Label>
                        <Input id="watermark-color" type="color" value={watermarkColor} onChange={e => setWatermarkColor(e.target.value)} className="h-10"/>
                    </div>
                </div>

                <div className="space-y-2">
                    <Label>Opacity: {Math.round(watermarkOpacity * 100)}%</Label>
                    <Slider value={[watermarkOpacity]} onValueChange={val => setWatermarkOpacity(val[0])} min={0.1} max={1} step={0.05} />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <Label>Placement</Label>
                        <Select value={watermarkPlacement} onValueChange={setWatermarkPlacement}>
                            <SelectTrigger><SelectValue/></SelectTrigger>
                            <SelectContent>
                                <SelectItem value="diagonal">Diagonal</SelectItem>
                                <SelectItem value="center">Center</SelectItem>
                                <SelectItem value="top">Top</SelectItem>
                                <SelectItem value="bottom">Bottom</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="watermark-pages">Apply to Pages</Label>
                        <Input id="watermark-pages" value={watermarkPages} onChange={e => setWatermarkPages(e.target.value)} placeholder='e.g., "all" or "1, 3-5"' />
                    </div>
                </div>

                <Button onClick={handleWatermark} disabled={isLoading || !fileToWatermark} className="w-full" size="lg">
                    {isLoading ? <Loader2 className="animate-spin mr-2" /> : <Droplets className="mr-2" />}
                    Add Watermark & Download
                </Button>
            </ToolContent>
          </TabsContent>
        </Tabs>
      </main>
      <ApiKeyDialog open={isApiDialogOpen} onOpenChange={setIsApiDialogOpen} />
    </div>
  );
}
