"use client";

import { useEffect } from 'react';
import { type NodeViewProps, NodeViewWrapper } from '@tiptap/react';
import { Loader2 } from 'lucide-react';

export const PlaceholderNodeView = ({ editor, getPos, node }: NodeViewProps) => {
  useEffect(() => {
    // Ensure the node still exists before trying to replace it
    if (editor.isDestroyed || typeof getPos !== 'function') return;

    const pos = getPos();
    // Use a short timeout to give the browser a frame to breathe
    const timeoutId = setTimeout(() => {
      if (editor.isDestroyed) return;
      
      // The content for the advanced task
      const taskContent = {
        type: node.attrs.type, // 'advancedTask'
        content: [{ type: 'text', text: 'New Task' }], // Start with some default text
      };
      
      const { from, to } = { from: pos, to: pos + node.nodeSize };
      
      editor
        .chain()
        .deleteRange({ from, to })
        .insertContentAt(from, taskContent, {
          updateSelection: true,
        })
        .run();

    }, 50); // 50ms delay is usually enough

    return () => clearTimeout(timeoutId);
  }, [editor, getPos, node]);

  return (
    <NodeViewWrapper>
      <div className="flex items-center justify-center p-4 text-muted-foreground gap-2">
        <Loader2 className="h-4 w-4 animate-spin" />
        Loading component...
      </div>
    </NodeViewWrapper>
  );
};
