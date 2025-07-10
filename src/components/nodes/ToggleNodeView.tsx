
'use client';

import React, { useState } from 'react';
import { NodeViewContent, NodeViewWrapper, type NodeViewProps } from '@tiptap/react';
import { ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Input } from '@/components/ui/input';

export const ToggleNodeView: React.FC<NodeViewProps> = ({ node, updateAttributes, selected }) => {
  const [isOpen, setIsOpen] = useState(node.attrs.isOpen || false);

  const toggleOpen = () => {
    const newState = !isOpen;
    setIsOpen(newState);
    updateAttributes({ isOpen: newState });
  };

  return (
    <NodeViewWrapper
      className={cn(
        "my-2 p-2 rounded-lg transition-colors",
        selected && "bg-muted/50"
      )}
      data-drag-handle
    >
      <div
        className="flex items-center gap-1 cursor-pointer group"
        onClick={toggleOpen}
      >
        <div
          className={cn(
            "p-1 rounded-md transition-all duration-200 group-hover:bg-muted",
            isOpen && 'rotate-90'
          )}
        >
          <ChevronRight className="h-5 w-5 text-muted-foreground" />
        </div>
        <Input
          value={node.attrs.title || 'Toggle'}
          onChange={(e) => updateAttributes({ title: e.target.value })}
          onClick={(e) => e.stopPropagation()} // Prevent toggle when clicking input
          className="font-semibold text-lg border-0 shadow-none focus-visible:ring-0 p-0 h-auto bg-transparent w-full"
          placeholder="Toggle Title"
        />
      </div>

      <div
        className={cn(
            "toggle-content ml-[1.6rem] mt-2 pl-4 border-l-2 transition-all duration-300 ease-in-out",
            isOpen ? "opacity-100 max-h-[1000px] visible" : "opacity-0 max-h-0 invisible"
        )}
      >
        <NodeViewContent className="content" />
      </div>
    </NodeViewWrapper>
  );
};
