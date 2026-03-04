'use client';

import React, { useRef, useState, useCallback } from 'react';
import { NodeViewWrapper, type NodeViewProps } from '@tiptap/react';
import { Button } from '@/components/ui/button';
import { Loader2, UploadCloud, Wand2 } from 'lucide-react';
import { processImage } from '@/lib/utils';
import { cn } from '@/lib/utils';
import { GenerateImageDialog } from '../GenerateImageDialog';
import { Input } from '@/components/ui/input';

export const ImageNodeView = ({ node, updateAttributes, selected }: NodeViewProps) => {
  const { src, caption, textAlign, layout } = node.attrs;
  const width = layout?.width || 40;

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
        <figure
          className={cn(
            'relative w-full group border rounded-lg overflow-hidden transition-shadow bg-card',
            selected && 'ring-2 ring-primary ring-offset-2'
          )}
        >
          {src ? (
            <img src={src} alt={node.attrs.alt || caption || ''} className="w-full block" />
          ) : (
            <div
              className="flex flex-col items-center justify-center w-full aspect-video"
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

          {(src && (selected || caption)) && (
            <figcaption className="px-2 pt-1.5 pb-2 border-t bg-card">
              {selected ? (
                <Input
                  className="w-full text-center text-sm border-0 bg-transparent focus-visible:ring-0 p-1"
                  placeholder="Add caption..."
                  value={caption || ''}
                  onChange={e => updateAttributes({ caption: e.target.value })}
                  onClick={e => e.stopPropagation()}
                />
              ) : (
                <p className="text-sm text-muted-foreground text-center px-2 py-1">{caption}</p>
              )}
            </figcaption>
          )}
        </figure>
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
