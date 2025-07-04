"use client";

import { Tldraw, TldrawSnapshot, TLSvgOptions } from '@tldraw/tldraw';
import '@tldraw/tldraw/tldraw.css';
import { NodeViewProps, NodeViewWrapper } from '@tiptap/react';
import { useEffect, useState } from 'react';
import { useIsMobile } from "@/hooks/use-mobile";

// --- The New, Simplified Interactive Desktop Component ---
const InteractiveTldrawCanvas = ({ tldrawState, onStateChange }: { tldrawState: string | null; onStateChange: (state: string) => void }) => {
  const store = tldrawState ? (JSON.parse(tldrawState) as TldrawSnapshot) : undefined;
  
  return (
    <div className="relative h-[400px] w-full border rounded-lg">
      <Tldraw
        store={store}
        onPersistenceChange={async (editor) => {
          onStateChange(await editor.store.toJson());
        }}
      />
    </div>
  );
};


// --- The Static Mobile Preview Component ---
const StaticTldrawPreview = ({ tldrawState }: { tldrawState: string | null }) => {
  const [svg, setSvg] = useState<string | null>(null);

  useEffect(() => {
    if (!tldrawState) {
        setSvg('<div class="flex h-[400px] w-full items-center justify-center rounded-lg border bg-muted text-muted-foreground">New Drawing Canvas</div>');
        return;
    };
    let isMounted = true;
    try {
      const snapshot = JSON.parse(tldrawState) as TldrawSnapshot;
      const opts: TLSvgOptions = { scale: 1, quality: 1, transparent: true };
      Tldraw.getSvg(snapshot, opts).then((generatedSvg) => {
        if (isMounted && generatedSvg) {
          setSvg(generatedSvg.outerHTML);
        }
      });
    } catch (error) {
        console.error("Failed to parse or generate SVG from tldraw state", error);
        setSvg('<div class="flex h-[400px] w-full items-center justify-center rounded-lg border border-destructive bg-destructive/10 text-destructive-foreground">Error loading drawing</div>');
    }
    return () => { isMounted = false; };
  }, [tldrawState]);

  if (!svg) {
    return <div className="flex h-[400px] w-full items-center justify-center rounded-lg border bg-muted text-muted-foreground">Loading Drawing...</div>;
  }
  
  return <div dangerouslySetInnerHTML={{ __html: svg }} />;
};

// --- The Main Node View Component ---
export const DrawingNodeView = ({ node, updateAttributes }: NodeViewProps) => {
  const isDesktop = !useIsMobile();

  const handleStateChange = (state: string) => {
    updateAttributes({ tldrawState: state });
  };
  
  return (
    <NodeViewWrapper className="my-4">
      {isDesktop ? (
        <InteractiveTldrawCanvas tldrawState={node.attrs.tldrawState} onStateChange={handleStateChange} />
      ) : (
        <StaticTldrawPreview tldrawState={node.attrs.tldrawState} />
      )}
    </NodeViewWrapper>
  );
};
