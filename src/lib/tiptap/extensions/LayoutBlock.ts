
import { Node, mergeAttributes } from '@tiptap/core';
import { ReactNodeViewRenderer } from '@tiptap/react';
import { LayoutBlockNodeView } from '@/components/nodes/LayoutBlockNodeView';

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    layoutBlock: {
      insertLayoutBlock: () => ReturnType;
    };
  }
}

export const LayoutBlock = Node.create({
  name: 'layoutBlock',
  group: 'block',
  content: 'block block', // This node must contain exactly two block nodes
  draggable: true,
  
  addAttributes() {
    return {
      cols: {
        default: [50, 50],
        parseHTML: element => {
            const cols = element.getAttribute('data-cols');
            try {
                return cols ? JSON.parse(cols) : [50, 50];
            } catch (e) {
                return [50, 50];
            }
        },
        renderHTML: attributes => ({
            'data-cols': JSON.stringify(attributes.cols),
        }),
      },
    };
  },

  parseHTML() {
    return [{ tag: 'div[data-type="layout-block"]' }];
  },

  renderHTML({ HTMLAttributes }) {
    // We let the NodeView handle the rendering of children
    return ['div', mergeAttributes(HTMLAttributes, { 'data-type': 'layout-block' })];
  },

  addNodeView() {
    return ReactNodeViewRenderer(LayoutBlockNodeView);
  },

  addCommands() {
    return {
      insertLayoutBlock: () => ({ chain }) => {
        return chain()
          .insertContent({
            type: this.name,
            content: [
              { type: 'paragraph', content: [] }, // First column
              { type: 'paragraph', content: [] }, // Second column
            ],
          })
          .run();
      },
    };
  },
});
