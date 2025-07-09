
'use client';

import React, { useCallback } from 'react';
import { NodeViewContent, NodeViewWrapper, type NodeViewProps } from '@tiptap/react';
import { Slider } from '@/components/ui/slider';
import { GripVertical } from 'lucide-react';
import { cn } from '@/lib/utils';

export const LayoutBlockNodeView: React.FC<NodeViewProps> = ({
  node,
  updateAttributes,
  selected,
}) => {
  const { cols } = node.attrs;

  const handleResize = useCallback((newFirstColWidth: number) => {
    updateAttributes({
      cols: [newFirstColWidth, 100 - newFirstColWidth],
    });
  }, [updateAttributes]);

  return (
    <NodeViewWrapper
      className={cn(
        'layout-block-wrapper my-4 rounded-lg transition-all',
        selected && 'ring-2 ring-primary ring-offset-2'
      )}
    >
      <div className="layout-block">
        <div
          className="layout-column"
          style={{ width: `${cols[0]}%` }}
        >
          <NodeViewContent className="w-full" />
        </div>
        <div
          className="layout-column"
          style={{ width: `${cols[1]}%` }}
        >
          <NodeViewContent className="w-full" />
        </div>
      </div>

      {selected && (
        <div className="absolute -bottom-8 left-1/2 -translate-x-1/2 w-48 bg-card border rounded-full shadow-lg p-1 flex items-center gap-2">
            <GripVertical className="h-5 w-5 text-muted-foreground flex-shrink-0" />
            <Slider
                value={[cols[0]]}
                min={20}
                max={80}
                step={5}
                onValueChange={(value) => handleResize(value[0])}
            />
            <GripVertical className="h-5 w-5 text-muted-foreground flex-shrink-0" />
        </div>
      )}
    </NodeViewWrapper>
  );
};
