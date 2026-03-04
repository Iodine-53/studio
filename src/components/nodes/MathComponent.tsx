"use client";

import React, { useState, useRef, useEffect } from 'react';
import { NodeViewWrapper, NodeViewProps } from '@tiptap/react';
import { InlineMath, BlockMath } from 'react-katex';
import 'katex/dist/katex.min.css';
import { cn } from '@/lib/utils';

/**
 * MathComponent
 * Handles rendering and in-place editing for both Inline and Block math.
 */
const MathComponent = ({ node, updateAttributes, selected }: NodeViewProps) => {
  const [isEditing, setIsEditing] = useState(false);
  const [latex, setLatex] = useState(node.attrs.content || '');
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  
  const isBlock = node.type.name === 'mathBlock';
  const textAlign = node.attrs.textAlign || (isBlock ? 'center' : 'left');

  // Auto-enter edit mode for newly created block equations
  useEffect(() => {
    if (selected && isBlock && !node.attrs.content) {
      setIsEditing(true);
    }
  }, [selected, isBlock, node.attrs.content]);

  // Manage focus and auto-sizing for the editing textarea
  useEffect(() => {
    if (isEditing && textareaRef.current) {
      textareaRef.current.focus();
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = textareaRef.current.scrollHeight + 'px';
    }
  }, [isEditing]);

  const handleSave = () => {
    updateAttributes({ content: latex });
    setIsEditing(false);
  };

  const onTextareaKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    // Ctrl+Enter or Cmd+Enter to save changes
    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
      e.preventDefault();
      handleSave();
    }
    // Escape to cancel and revert
    if (e.key === 'Escape') {
      e.preventDefault();
      setLatex(node.attrs.content || '');
      setIsEditing(false);
    }
  };

  const containerStyle: React.CSSProperties = {
    textAlign: textAlign as any,
  };

  if (isEditing) {
    return (
      <NodeViewWrapper 
        className={cn(
          "relative z-10 transition-all duration-200",
          isBlock ? "w-full my-6" : "inline-block min-w-[60px] mx-1 align-baseline"
        )} 
        style={containerStyle}
      >
        <div className="relative group">
          <textarea
            ref={textareaRef}
            value={latex}
            onChange={(e) => {
              setLatex(e.target.value);
              e.target.style.height = 'auto';
              e.target.style.height = e.target.scrollHeight + 'px';
            }}
            onBlur={handleSave}
            onKeyDown={onTextareaKeyDown}
            placeholder={isBlock ? "Enter LaTeX (e.g., E=mc^2)" : "LaTeX..."}
            className={cn(
              "w-full p-3 font-mono text-sm border-2 border-primary/40 rounded-xl shadow-lg bg-background focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/10 resize-none overflow-hidden transition-all",
              isBlock ? "text-center" : "inline-block min-w-[120px] text-left"
            )}
          />
          <div className="absolute -bottom-6 right-0 opacity-0 group-hover:opacity-100 transition-opacity text-[10px] font-bold text-muted-foreground pointer-events-none uppercase tracking-widest flex items-center gap-2">
            <span className="bg-muted px-1.5 py-0.5 rounded border shadow-sm">Ctrl+Enter</span> to save
          </div>
        </div>
      </NodeViewWrapper>
    );
  }

  return (
    <NodeViewWrapper
      onClick={() => setIsEditing(true)}
      className={cn(
        "transition-all duration-200 rounded-lg group/math cursor-pointer hover:bg-primary/5",
        isBlock ? "my-6 w-full py-3 px-4" : "inline-block px-1.5 py-0.5 mx-0.5 align-baseline",
        selected && !isEditing && "ring-2 ring-primary ring-offset-4 bg-primary/10 shadow-md"
      )}
      style={containerStyle}
    >
      <div className={cn(
        "math-renderer-content",
        !isBlock && "inline-block",
        // Force KaTeX display-mode equations to respect parent alignment
        isBlock && "w-full [&_.katex-display]:m-0 [&_.katex-display]:text-inherit [&_.katex-display>.katex]:text-inherit [&_.katex]:whitespace-pre-wrap"
      )}>
        {isBlock ? (
          <BlockMath math={latex || 'E = mc^2'} />
        ) : (
          <InlineMath math={latex || '\\pi'} />
        )}
      </div>
    </NodeViewWrapper>
  );
};

export default MathComponent;
