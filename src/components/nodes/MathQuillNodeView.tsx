
'use client';

import React, { useState, useEffect } from 'react';
import type { NodeViewProps } from '@tiptap/react';
import { NodeViewWrapper } from '@tiptap/react';
import { addStyles, EditableMathField } from 'react-mathquill';
import { cn } from '@/lib/utils';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

// Required for MathQuill to render correctly
addStyles();

export const MathQuillNodeView: React.FC<NodeViewProps> = ({ node, updateAttributes, selected }) => {
  const { latex } = node.attrs;
  const isEditing = selected;

  // Use a local state for the input field to avoid re-rendering the MathField on every change.
  const [currentLatex, setCurrentLatex] = useState(latex);

  // When the node is deselected, save the final LaTeX string to Tiptap's attributes.
  useEffect(() => {
    if (!isEditing) {
      updateAttributes({ latex: currentLatex });
    }
  }, [isEditing, currentLatex, updateAttributes]);

  return (
    <NodeViewWrapper className="my-4 inline-block">
      <div className={cn("p-2 border rounded-lg bg-card transition-shadow relative", isEditing ? "ring-2 ring-primary shadow-lg" : "cursor-pointer")}>
        <EditableMathField
          latex={currentLatex}
          onChange={(mathField) => {
            setCurrentLatex(mathField.latex());
          }}
          config={{
            autoCommands: 'pi theta sqrt sum int',
            autoOperatorNames: 'sin cos tan',
          }}
          className="min-w-[50px] text-lg p-2"
          dir="ltr"
          aria-readonly={!isEditing}
        />
        {isEditing && (
          <div className="mt-2 p-2 bg-muted/50 rounded-md">
            <Label htmlFor="latex-input" className="text-xs font-semibold">LaTeX Input</Label>
            <Input
              id="latex-input"
              value={currentLatex}
              onChange={(e) => setCurrentLatex(e.target.value)}
              className="font-mono text-xs h-8"
              onClick={(e) => e.stopPropagation()} // Prevent node deselection
            />
          </div>
        )}
      </div>
    </NodeViewWrapper>
  );
};
