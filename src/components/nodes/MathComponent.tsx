"use client";

import { NodeViewWrapper, NodeViewProps } from '@tiptap/react';
import { useState, useRef, useEffect } from 'react';
import { InlineMath, BlockMath } from 'react-katex';
import 'katex/dist/katex.min.css';
import { cn } from '@/lib/utils';

interface MathViewProps extends NodeViewProps {
  node: NodeViewProps['node'] & {
    attrs: {
      content: string;
      textAlign?: string;
    };
  };
}

const MathComponent = ({ node, updateAttributes, selected }: MathViewProps) => {
  const [isEditing, setIsEditing] = useState(false);
  const [latex, setLatex] = useState(node.attrs.content || '');
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const isBlock = node.type.name === 'mathBlock';
  const textAlign = node.attrs.textAlign || (isBlock ? 'center' : 'left');

  useEffect(() => {
    if (selected && isBlock && !node.attrs.content) {
      setIsEditing(true);
    }
  }, [selected, isBlock, node.attrs.content]);

  useEffect(() => {
    if (isEditing && textareaRef.current) {
      textareaRef.current.focus();
      // Auto-resize textarea
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

  const wrapperClasses = cn(
    "transition-all duration-200 rounded-md",
    isBlock ? "my-6 w-full" : "inline-block px-1",
    selected && !isEditing && "ring-2 ring-primary ring-offset-2 bg-primary/5",
    !isEditing && "cursor-pointer hover:bg-muted/50"
  );

  const containerStyle: React.CSSProperties = {
    textAlign: textAlign as any,
  };

  if (isEditing) {
    return (
      <NodeViewWrapper className={cn(isBlock ? "w-full my-4" : "inline-block min-w-[50px]")} style={containerStyle}>
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
            placeholder={isBlock ? "Enter LaTeX (e.g. \\sum_{i=1}^n i = \\frac{n(n+1)}{2})" : "LaTeX..."}
            className={cn(
              "w-full p-3 font-mono text-sm border rounded-md shadow-inner bg-muted/30 focus:outline-none focus:ring-2 focus:ring-primary/50 resize-none overflow-hidden",
              isBlock ? "text-center" : "inline-block min-w-[100px]"
            )}
          />
          <div className="absolute -bottom-6 right-0 opacity-0 group-hover:opacity-100 transition-opacity text-[10px] text-muted-foreground pointer-events-none">
            Press <kbd className="font-sans border rounded px-1">Ctrl+Enter</kbd> to save
          </div>
        </div>
      </NodeViewWrapper>
    );
  }

  return (
    <NodeViewWrapper
      onClick={() => setIsEditing(true)}
      className={wrapperClasses}
      style={containerStyle}
    >
      <div className={cn("py-2 px-4", !isBlock && "inline-block py-0.5 px-1")}>
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
