
import { Node, mergeAttributes } from '@tiptap/core';
import { ReactNodeViewRenderer } from '@tiptap/react';
import MindMapComponent from '@/components/nodes/MindMapComponent';

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    mindMap: {
      insertMindMap: () => ReturnType;
    }
  }
}

export const MindMap = Node.create({
  name: 'mindMap',
  group: 'block',
  atom: true,
  draggable: true,

  addAttributes() {
    return {
      nodes: {
        default: [],
      },
      edges: {
        default: [],
      },
      imageBase64: {
        default: null,
        renderHTML: () => null, // Don't render this to HTML, it's for export only
      },
      textAlign: {
        default: 'center',
        parseHTML: element => element.getAttribute('data-text-align'),
        renderHTML: attributes => {
          if (attributes.textAlign) {
            return { 'data-text-align': attributes.textAlign };
          }
          return {};
        },
      },
      layout: {
        default: { width: 100, height: 500 },
        parseHTML: element => {
            const layoutAttr = element.getAttribute('data-layout');
            try {
                return layoutAttr ? JSON.parse(layoutAttr) : { width: 100, height: 500 };
            } catch {
                return { width: 100, height: 500 };
            }
        },
        renderHTML: attributes => ({
            'data-layout': JSON.stringify(attributes.layout),
        }),
      },
    };
  },

  parseHTML() {
    return [{ tag: 'div[data-type="mind-map"]' }];
  },

  renderHTML({ HTMLAttributes }) {
    // We only store data; rendering is done by the Node View.
    return ['div', mergeAttributes(HTMLAttributes, { 'data-type': 'mind-map' })];
  },

  addNodeView() {
    return ReactNodeViewRenderer(MindMapComponent);
  },

  addCommands() {
    return {
      insertMindMap: () => ({ commands }) => {
        // Insert a mind map with a single root node to start.
        return commands.insertContent({
          type: this.name,
          attrs: {
            nodes: [{ id: 1, label: 'Central Idea' }],
            edges: [],
          },
        });
      },
    };
  },
});
