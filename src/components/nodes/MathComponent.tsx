"use client";

import React, { useState, useRef, useEffect } from 'react';
import { NodeViewWrapper, NodeViewProps } from '@tiptap/react';
import { InlineMath, BlockMath } from 'react-katex';
import 'katex/dist/katex.min.css';
import { cn } from '@/lib/utils';

/**
 * Math Pro Component
 * Handles rendering and advanced in-place editing for equations.
 * Strictly respects alignment from the TipTap node attributes.
 */
const MathComponent = ({ node, updateAttributes, selected }: NodeViewProps) => {
  const [isEditing, setIsEditing] = useState(false);
  const [latex, setLatex] = useState(node.attrs.content || '');
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  
  const isBlock = node.type.name === 'mathBlock';
  const textAlign = node.attrs.textAlign || (isBlock ? 'center' : 'left');

  useEffect(() => {
    setLatex(node.attrs.content || '');
  }, [node.attrs.content]);

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
    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
      e.preventDefault();
      handleSave();
    }
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
          "relative z-10",
          isBlock ? "w-full my-6" : "inline-block mx-1"
        )} 
        style={containerStyle}
      >
        <div className={cn(
          "relative group inline-block text-left",
          isBlock ? "max-w-3xl" : "min-w-[150px]"
        )}>
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
            placeholder="LaTeX..."
            className="w-full p-4 font-mono text-sm border-2 border-primary/40 rounded-xl shadow-xl bg-background focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/10 resize-none overflow-hidden transition-all"
          />
          <div className="absolute -bottom-6 right-0 opacity-0 group-hover:opacity-100 transition-opacity text-[10px] font-bold text-muted-foreground uppercase tracking-widest bg-background/80 px-2 py-0.5 rounded shadow-sm">
            Ctrl+Enter to save
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
        isBlock ? "my-6 w-full py-4 px-6" : "inline-block px-1.5 py-0.5 mx-0.5 align-baseline",
        selected && !isEditing && "ring-2 ring-primary ring-offset-4 bg-primary/10"
      )}
      style={containerStyle}
    >
      <div className={cn(
        "math-renderer-content",
        !isBlock && "inline-block",
        isBlock && "w-full [&_.katex-display]:m-0 [&_.katex-display]:text-inherit [&_.katex-display>.katex]:text-inherit"
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
