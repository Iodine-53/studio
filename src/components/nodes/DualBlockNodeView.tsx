
'use client';

import { NodeViewContent, NodeViewWrapper } from '@tiptap/react';
import React from 'react';

// React component for the dual block layout
export const DualBlockNodeView = ({ node, updateAttributes }) => {
  const { leftWidth = 50 } = node.attrs;

  // This component will now correctly render two independent Tiptap-managed editor areas.
  return (
    <NodeViewWrapper
      className="layout-block not-prose"
      data-drag-handle
    >
      <div
        className="layout-column"
        style={{
            width: `${leftWidth}%`,
            border: '1px solid hsl(var(--border))',
            borderRadius: '0.5rem',
            padding: '0.5rem',
            minHeight: '4rem'
        }}
      >
        <NodeViewContent className="nodrag block-content" />
      </div>
      <div
        className="layout-column"
        style={{
            width: `${100 - leftWidth}%`,
            border: '1px solid hsl(var(--border))',
            borderRadius: '0.5rem',
            padding: '0.5rem',
            minHeight: '4rem'
        }}
      >
        <NodeViewContent className="nodrag block-content" />
      </div>
    </NodeViewWrapper>
  );
};
