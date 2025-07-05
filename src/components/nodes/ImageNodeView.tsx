
'use client';

import React, { useRef, useState, useCallback } from 'react';
import { NodeViewWrapper, type NodeViewProps } from '@tiptap/react';
import { Button } from '@/components/ui/button';
import { Loader2, UploadCloud } from 'lucide-react';
import { processImage } from '@/lib/utils';
import { cn } from '@/lib/utils';

export const ImageNodeView = ({ node, updateAttributes, selected }: NodeViewProps) => {
  const { src, textAlign, layout } = node.attrs;
  const width = layout?.width || 100;

  const [isLoading, setIsLoading] = useState(false);
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

  const handleContainerClick = () => {
    if (!src) {
      fileInputRef.current?.click();
    }
  };

  return (
    <NodeViewWrapper
      className="my-4"
      data-align={textAlign}
      style={{ width: `${width}%` }}
    >
      <div
        className={cn('relative w-full', selected && 'ring-2 ring-primary ring-offset-2 rounded-lg')}
      >
        {src ? (
          <img src={src} alt={node.attrs.alt || ''} className="rounded-lg w-full block" />
        ) : (
          <div
            onClick={handleContainerClick}
            className="flex flex-col items-center justify-center w-full aspect-video border-2 border-dashed rounded-lg cursor-pointer bg-muted/50 hover:bg-muted/80 transition-colors"
          >
            {isLoading ? (
              <>
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <p className="mt-2 text-sm text-muted-foreground">Processing...</p>
              </>
            ) : (
              <>
                <UploadCloud className="h-8 w-8 text-muted-foreground" />
                <p className="mt-2 text-sm text-muted-foreground">Click to upload an image</p>
                <p className="text-xs text-muted-foreground">Recommended: 1200x800</p>
                <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
              </>
            )}
          </div>
        )}
      </div>
    </NodeViewWrapper>
  );
};
