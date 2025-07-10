
'use client';

import React, { useState } from 'react';
import { NodeViewContent, NodeViewWrapper, type NodeViewProps } from '@tiptap/react';
import { ChevronRight, Edit3, Trash2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

export const ToggleNodeView: React.FC<NodeViewProps> = ({ node, updateAttributes, selected, deleteNode }) => {
  const [isOpen, setIsOpen] = useState(node.attrs.isOpen || false);
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [tempTitle, setTempTitle] = useState(node.attrs.title || 'Toggle');

  const toggleOpen = () => {
    if (isEditingTitle) return;
    const newState = !isOpen;
    setIsOpen(newState);
    updateAttributes({ isOpen: newState });
  };
  
  const handleTitleSave = () => {
    updateAttributes({ title: tempTitle });
    setIsEditingTitle(false);
  };
  
  const handleTitleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleTitleSave();
    }
    if (e.key === 'Escape') {
      setIsEditingTitle(false);
      setTempTitle(node.attrs.title);
    }
  };


  return (
    <NodeViewWrapper
      className={cn(
        "my-2 p-2 rounded-lg transition-colors group/toggle",
        selected && "bg-muted/50"
      )}
      data-drag-handle
    >
      <div
        className="flex items-center gap-1 cursor-pointer group"
      >
        <div
          className={cn(
            "p-1 rounded-md transition-all duration-200 hover:bg-muted",
            isOpen && 'rotate-90'
          )}
          onClick={toggleOpen}
        >
          <ChevronRight className="h-5 w-5 text-muted-foreground" />
        </div>
        
        {isEditingTitle ? (
            <Input
              value={tempTitle}
              onChange={(e) => setTempTitle(e.target.value)}
              onBlur={handleTitleSave}
              onKeyDown={handleTitleKeyDown}
              autoFocus
              className="font-semibold text-lg border-0 shadow-none focus-visible:ring-0 p-0 h-auto bg-transparent w-full"
              onClick={(e) => e.stopPropagation()}
            />
        ) : (
            <span
              onClick={toggleOpen}
              className="font-semibold text-lg p-0 w-full"
            >
              {node.attrs.title}
            </span>
        )}
        
        <div className="opacity-0 group-hover/toggle:opacity-100 transition-opacity flex items-center">
            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setIsEditingTitle(true)} title="Edit title">
                <Edit3 className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive/70 hover:text-destructive" onClick={deleteNode} title="Delete toggle">
                <Trash2 className="h-4 w-4" />
            </Button>
        </div>
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
