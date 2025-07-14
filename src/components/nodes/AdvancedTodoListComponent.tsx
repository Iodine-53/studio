
"use client";

import React, { useState, useCallback, CSSProperties } from 'react';
import { NodeViewContent, NodeViewWrapper, type NodeViewProps } from '@tiptap/react';
import { Plus, Trash2, Settings2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import { type Editor } from '@tiptap/core';

const AdvancedTodoListComponent: React.FC<NodeViewProps> = ({ node, getPos, editor }) => {
  const { blockId, textAlign, layout, fontSize, color, backgroundColor } = node.attrs;
  const isEditing = editor.isEditable;
  const width = layout?.width || 100;

  const handleAddTask = useCallback(() => {
    if (typeof getPos !== 'function') return;

    const pos = getPos() + node.nodeSize - 1; // Insert inside the node, at the end
    
    editor.chain().insertContentAt(pos, {
      type: 'advancedTask',
      content: [{
        type: 'text',
        text: 'New Task'
      }]
    }).focus(pos + 2).run(); // Focus inside the new task
  }, [editor, getPos, node.nodeSize]);
  
  const componentStyle: CSSProperties = {
      fontSize: fontSize || undefined,
      color: color || undefined,
      backgroundColor: backgroundColor || 'hsl(var(--card))',
  };

  return (
    <NodeViewWrapper
      className="my-4 custom-node-wrapper"
      data-align={textAlign}
      style={{ width: `${width}%` }}
    >
      <Card 
        className={cn("w-full transition-shadow", isEditing && 'ring-2 ring-primary ring-offset-2')}
        style={isEditing ? { ...componentStyle, backgroundColor: 'hsl(var(--card))' } : componentStyle}
      >
        <CardHeader>
          <CardTitle>To-Do List</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-1">
            <NodeViewContent />
          </div>
          {isEditing && (
            <Button onClick={handleAddTask} variant="ghost" size="sm" className="mt-2 text-muted-foreground">
              <Plus size={16} className="mr-2" />
              Add Task
            </Button>
          )}
        </CardContent>
      </Card>
    </NodeViewWrapper>
  );
};

export default AdvancedTodoListComponent;
