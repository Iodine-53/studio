
'use client';

import { NodeViewWrapper } from '@tiptap/react';
import React from 'react';

// This is the correct implementation for a Node View with multiple editable content areas.
// Tiptap provides the `node` prop which contains the child nodes. The `contentDOM` property
// on each child node is where Tiptap expects to mount its editable content.
export const DualBlockNodeView = ({ node, editor }: { node: any, editor: any }) => {
  return (
    <NodeViewWrapper className="layout-block not-prose" data-drag-handle>
      <div
        className="layout-column"
        ref={(domNode) => {
          // This ref is how Tiptap knows where to render the first child's content.
          // We find our target `.block-content` div and assign the first child's `contentDOM` to it.
          if (domNode) {
            const content = domNode.querySelector('.block-content');
            if (content) {
                (node.firstChild.contentDOM as HTMLElement) = content as HTMLElement;
            }
          }
        }}
      >
        <div className="block-content"></div>
      </div>
      <div
        className="layout-column"
        ref={(domNode) => {
          // This ref is for the second child's content.
          // Same logic: find the target and assign the last child's `contentDOM` to it.
          if (domNode) {
            const content = domNode.querySelector('.block-content');
            if (content) {
                (node.lastChild.contentDOM as HTMLElement) = content as HTMLElement;
            }
          }
        }}
      >
        <div className="block-content"></div>
      </div>
    </NodeViewWrapper>
  );
};
