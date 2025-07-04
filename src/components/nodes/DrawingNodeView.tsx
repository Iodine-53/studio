
"use client";

import { Tldraw, TldrawSnapshot, TLSvgOptions } from '@tldraw/tldraw';
import '@tldraw/tldraw/tldraw.css';
import { NodeViewProps, NodeViewWrapper } from '@tiptap/react';
import { useEffect, useState } from 'react';
import { useIsMobile } from "@/hooks/use-mobile";

// --- 2. The Interactive Desktop Component ---
const InteractiveTldrawCanvas = ({ tldrawState, onStateChange }: { tldrawState: string | null; onStateChange: (state: string) => void }) => {
  const [isEditing, setIsEditing] = useState(false);
  const store = tldrawState ? (JSON.parse(tldrawState) as TldrawSnapshot) : undefined;
  
  const handleWrapperClick = () => {
    // If we are not in edit mode, a click on the canvas should enter edit mode.
    if (!isEditing) {
      setIsEditing(true);
    }
  };

  return (
    // The main wrapper controls entering edit mode.
    <div
      className={`relative h-[400px] w-full border rounded-lg overflow-hidden ${isEditing ? 'z-50' : 'z-0'} ${isEditing ? '' : 'cursor-pointer'}`}
      onClick={handleWrapperClick}
    >
      <Tldraw
        store={store}
        onPersistenceChange={async (editor) => {
          // We always save the state, tldraw is smart about not over-saving.
          onStateChange(await editor.store.toJson());
        }}
        // The UI is hidden based on our editing state.
        hideUi={!isEditing}
      />

      {/* The "Done" button only appears when editing. */}
      {isEditing && (
        <button
          onClick={(e) => {
            e.stopPropagation(); // Prevent the wrapper's onClick from firing.
            setIsEditing(false);
          }}
          className="absolute top-2 right-2 z-20 bg-white dark:bg-black text-black dark:text-white px-3 py-1 rounded-md shadow-md border border-gray-300 dark:border-gray-700 text-sm"
        >
          Done
        </button>
      )}
    </div>
  );
};


// --- 3. The Static Mobile Preview Component ---
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

// --- 4. The Main Node View Component ---
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
