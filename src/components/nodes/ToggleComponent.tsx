
"use client";

import { NodeViewContent, NodeViewProps, NodeViewWrapper } from '@tiptap/react';
import { ChevronRight, Edit3, X } from 'lucide-react';
import { useState, useRef, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

const ToggleComponent = ({ node, updateAttributes, deleteNode }: NodeViewProps) => {
  const [isOpen, setIsOpen] = useState(node.attrs.isOpen || false);
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [title, setTitle] = useState(node.attrs.title || 'Toggle');
  const titleInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isEditingTitle && titleInputRef.current) {
      titleInputRef.current.focus();
    }
  }, [isEditingTitle]);

  const toggleOpen = () => {
    const newState = !isOpen;
    setIsOpen(newState);
    updateAttributes({ isOpen: newState });
  };

  const handleTitleSave = () => {
    updateAttributes({ title });
    setIsEditingTitle(false);
  };
  
  const handleTitleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleTitleSave();
    }
    if (e.key === 'Escape') {
      setIsEditingTitle(false);
      setTitle(node.attrs.title);
    }
  };

  return (
    <NodeViewWrapper className="my-2 group/toggle">
      <div 
        className="flex items-center gap-1 group rounded-t-lg"
        data-drag-handle
      >
        <div
          onClick={toggleOpen}
          className="p-1 rounded-md transition-colors hover:bg-muted cursor-pointer"
        >
          <ChevronRight 
            className={cn(
                "h-5 w-5 text-muted-foreground transition-transform duration-200",
                isOpen && 'rotate-90'
            )} 
          />
        </div>

        {isEditingTitle ? (
          <Input
            ref={titleInputRef}
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            onBlur={handleTitleSave}
            onKeyDown={handleTitleKeyDown}
            className="font-bold text-lg border-0 shadow-none focus-visible:ring-0 p-0 h-auto bg-transparent w-full"
            onClick={(e) => e.stopPropagation()}
          />
        ) : (
          <span
            onClick={() => setIsEditingTitle(true)}
            className="font-bold text-lg p-1 flex-1 cursor-pointer"
          >
            {node.attrs.title}
          </span>
        )}
        
        <div className="opacity-0 group-hover/toggle:opacity-100 transition-opacity flex items-center">
            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setIsEditingTitle(true)} title="Edit title">
                <Edit3 className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive/70 hover:text-destructive" onClick={deleteNode} title="Delete toggle">
                <X className="h-4 w-4" />
            </Button>
        </div>
      </div>
      
      <div className={cn(
        "pl-8 border-l-2 ml-3 transition-all duration-300 ease-in-out",
        isOpen ? "py-2" : "h-0 overflow-hidden p-0 border-transparent"
      )}>
          <NodeViewContent />
      </div>
    </NodeViewWrapper>
  );
};

export default ToggleComponent;
