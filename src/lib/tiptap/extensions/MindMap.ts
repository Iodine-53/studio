
import { Node, mergeAttributes } from '@tiptap/core';
import { ReactNodeViewRenderer } from '@tiptap/react';
import { MindMapNodeView } from '@/components/nodes/MindMapNodeView';

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    mindMap: {
      insertMindMap: () => ReturnType;
    };
  }
}

export const MindMap = Node.create({
  name: 'mindMap',
  group: 'block',
  atom: true,
  draggable: true,

  addAttributes() {
    return {
      title: {
        default: 'My Mind Map',
      },
      data: {
        default: {
          nodes: [
            { id: 1, label: 'Central Idea' },
            { id: 2, label: 'Main Topic 1' },
            { id: 3, label: 'Main Topic 2' },
          ],
          edges: [
            { from: 1, to: 2 },
            { from: 1, to: 3 },
          ],
        },
      },
      instanceId: {
        default: null,
      },
      textAlign: {
        default: 'center',
        parseHTML: (element) => element.getAttribute('data-text-align'),
        renderHTML: (attributes) => ({ 'data-text-align': attributes.textAlign }),
      },
      layout: {
        default: { width: 100, height: 500 },
        parseHTML: (element) => {
          const layoutAttr = element.getAttribute('data-layout');
          try {
            return layoutAttr ? JSON.parse(layoutAttr) : { width: 100, height: 500 };
          } catch {
            return { width: 100, height: 500 };
          }
        },
        renderHTML: (attributes) => ({
          'data-layout': JSON.stringify(attributes.layout),
        }),
      },
    };
  },

  parseHTML() {
    return [{ tag: 'div[data-type="mind-map"]' }];
  },

  renderHTML({ HTMLAttributes }) {
    return ['div', mergeAttributes(HTMLAttributes, { 'data-type': 'mind-map' })];
  },

  addNodeView() {
    return ReactNodeViewRenderer(MindMapNodeView);
  },

  addCommands() {
    return {
      insertMindMap: () => ({ commands }) => {
        return commands.insertContent({
          type: this.name,
          attrs: {
            instanceId: `mindmap-${Math.ceil(Math.random() * 100000)}`,
          }
        });
      },
    };
  },
});
