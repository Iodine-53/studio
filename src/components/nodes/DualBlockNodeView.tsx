
'use client';

import { NodeViewWrapper } from '@tiptap/react';
import React from 'react';

// This is the correct implementation for a Node View with multiple editable content areas.
// We provide two divs that will serve as the mounting points for the left and right column content.
// Tiptap's `ReactNodeViewRenderer` will then correctly manage these two separate areas.
export const DualBlockNodeView = ({ node }) => {
  return (
    <NodeViewWrapper className="layout-block not-prose" data-drag-handle>
      <div
        className="layout-column"
        // This ref is how Tiptap knows where to render the first child's content
        ref={(domNode) => {
          if (domNode) {
            const content = domNode.querySelector('.block-content');
            if (content) {
                (node as any).firstChild.contentDOM = content;
            }
          }
        }}
      >
        <div className="block-content"></div>
      </div>
      <div
        className="layout-column"
        // This ref is for the second child's content
        ref={(domNode) => {
          if (domNode) {
            const content = domNode.querySelector('.block-content');
            if (content) {
                (node as any).lastChild.contentDOM = content;
            }
          }
        }}
      >
        <div className="block-content"></div>
      </div>
    </NodeViewWrapper>
  );
};
