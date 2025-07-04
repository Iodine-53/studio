"use client";

import type { NodeViewProps } from "@tiptap/react";
import { NodeViewWrapper } from "@tiptap/react";
import dynamic from 'next/dynamic';
import "@tldraw/tldraw/style.css";
import { useMemo, useCallback } from "react";
import { Skeleton } from "@/components/ui/skeleton";

// Use next/dynamic to lazy-load the Tldraw component on the client-side only
const TldrawCanvas = dynamic(
  async () => {
    const { Tldraw } = await import('@tldraw/tldraw');
    return Tldraw;
  },
  {
    ssr: false,
    loading: () => <Skeleton className="h-full w-full" />,
  }
);


// Simple debounce function to avoid excessive updates
function debounce<F extends (...args: any[]) => any>(func: F, waitFor: number) {
  let timeout: NodeJS.Timeout;
  return (...args: Parameters<F>): void => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), waitFor);
  };
}

export const TldrawNodeView = ({ node, updateAttributes }: NodeViewProps) => {
  // Memoize the debounced update function to prevent re-creation on every render
  const saveContent = useMemo(() => {
    return debounce((data: any) => {
      // Don't save if the editor is being destroyed
      if (!updateAttributes) return;
      updateAttributes({ data });
    }, 500); // 500ms debounce delay
  }, [updateAttributes]);

  // Use useCallback to prevent the function from being re-created on every render
  const handleChange = useCallback(
    (editor: any) => {
      // In tldraw v2, the editor object is passed, and we get the document from it.
      const document = editor.store.getSnapshot();
      saveContent(document);
    },
    [saveContent]
  );

  return (
    <NodeViewWrapper className="relative h-[550px] w-full my-4 border rounded-lg overflow-hidden">
      <TldrawCanvas
        store={node.attrs.data}
        onMount={(editor) => {
            // Persist changes
            editor.on('change', () => {
                const snapshot = editor.store.getSnapshot();
                saveContent(snapshot);
            });
        }}
        autofocus
        showUi={true}
      />
    </NodeViewWrapper>
  );
};
