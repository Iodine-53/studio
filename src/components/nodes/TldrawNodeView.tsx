"use client";

import type { NodeViewProps } from "@tiptap/react";
import { NodeViewWrapper } from "@tiptap/react";
import { Tldraw } from "@tldraw/tldraw";
import "@tldraw/tldraw/style.css";
import { useMemo, useCallback } from "react";

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
    (app: any) => {
      saveContent(app.document);
    },
    [saveContent]
  );

  return (
    <NodeViewWrapper className="relative h-[550px] w-full my-4 border rounded-lg overflow-hidden">
      <Tldraw
        id={node.attrs.id || "tldraw-canvas"}
        document={node.attrs.data}
        onChange={handleChange}
        autofocus
        showUi={true} // Show the full tldraw UI
      />
    </NodeViewWrapper>
  );
};
