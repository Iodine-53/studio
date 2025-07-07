
'use client';

import React, { useRef, useState, useCallback } from 'react';
import { NodeViewWrapper, type NodeViewProps } from '@tiptap/react';
import { Button } from '@/components/ui/button';
import { Loader2, UploadCloud, Wand2 } from 'lucide-react';
import { processImage } from '@/lib/utils';
import { cn } from '@/lib/utils';
import { GenerateImageDialog } from '../GenerateImageDialog';

export const ImageNodeView = ({ node, updateAttributes, selected }: NodeViewProps) => {
  const { src, textAlign, layout } = node.attrs;
  const width = layout?.width || 100;

  const [isLoading, setIsLoading] = useState(false);
  const [isGenerateDialogOpen, setIsGenerateDialogOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = useCallback(
    async (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      if (!file) return;

      setIsLoading(true);
      try {
        const webpDataUrl = await processImage(file);
        updateAttributes({ src: webpDataUrl });
      } catch (error) {
        console.error('Image processing failed:', error);
        // Optionally, show a toast notification for the error
      } finally {
        setIsLoading(false);
      }
    },
    [updateAttributes]
  );
  
  const handleAiGenerate = useCallback(
    (generatedSrc: string) => {
      updateAttributes({ src: generatedSrc });
      setIsLoading(false);
    },
    [updateAttributes]
  );

  return (
    <>
      <NodeViewWrapper
        className="my-4 custom-node-wrapper"
        data-align={textAlign}
        style={{ width: `${width}%` }}
      >
        <div
          className={cn('relative w-full group', selected && 'ring-2 ring-primary ring-offset-2 rounded-lg')}
        >
          {src ? (
            <img src={src} alt={node.attrs.alt || ''} className="rounded-lg w-full block" />
          ) : (
            <div
              className="flex flex-col items-center justify-center w-full aspect-video border-2 border-dashed rounded-lg bg-muted/50"
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  <p className="mt-2 text-sm text-muted-foreground">Processing...</p>
                </>
              ) : (
                <div className="text-center">
                  <div className="flex gap-4">
                     <Button variant="secondary" onClick={() => fileInputRef.current?.click()}>
                        <UploadCloud className="mr-2 h-4 w-4" />
                        Upload Image
                     </Button>
                     <Button variant="secondary" onClick={() => setIsGenerateDialogOpen(true)}>
                        <Wand2 className="mr-2 h-4 w-4" />
                        Generate with AI
                     </Button>
                  </div>
                  <p className="text-xs text-muted-foreground mt-4">Recommended: 1200x800</p>
                  <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
                </div>
              )}
            </div>
          )}
        </div>
      </NodeViewWrapper>
      <GenerateImageDialog
        open={isGenerateDialogOpen}
        onOpenChange={setIsGenerateDialogOpen}
        onGenerate={(generatedSrc) => {
            setIsLoading(true);
            handleAiGenerate(generatedSrc);
        }}
       />
    </>
  );
};
