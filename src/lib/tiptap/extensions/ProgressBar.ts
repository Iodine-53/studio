
import { Node, mergeAttributes } from '@tiptap/core';
import { ReactNodeViewRenderer } from '@tiptap/react';
import { ProgressBarNodeView } from '@/components/nodes/ProgressBarNodeView';

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    progressBarBlock: {
      insertProgressBarBlock: (attributes?: any) => ReturnType;
    };
  }
}

export const ProgressBarBlock = Node.create({
  name: 'progressBarBlock',
  group: 'block',
  atom: true,
  draggable: true,

  addAttributes() {
    return {
      blockTitle: {
        default: 'Progress Tracker',
      },
      progressBars: {
        default: [
          { id: 1, title: 'Project Alpha', progress: 65, color: '#3B82F6' },
          { id: 2, title: 'Task Beta', progress: 40, color: '#10B981' },
          { id: 3, title: 'Goal Gamma', progress: 85, color: '#F59E0B' }
        ],
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
        default: { width: 100 },
        parseHTML: element => {
            const layoutAttr = element.getAttribute('data-layout');
            try {
                return layoutAttr ? JSON.parse(layoutAttr) : { width: 100 };
            } catch {
                return { width: 100 };
            }
        },
        renderHTML: attributes => ({
            'data-layout': JSON.stringify(attributes.layout),
        }),
      },
    };
  },
  
  parseHTML() {
    return [{ tag: 'div[data-type="progress-bar-block"]' }];
  },
  
  renderHTML({ HTMLAttributes }) {
    return ['div', mergeAttributes(HTMLAttributes, { 'data-type': 'progress-bar-block' })];
  },
  
  addNodeView() {
    return ReactNodeViewRenderer(ProgressBarNodeView);
  },
  
  addCommands() {
    return {
      insertProgressBarBlock: (attributes) => ({ commands }) => {
        return commands.insertContent({
          type: this.name,
          attrs: attributes,
        });
      },
    };
  },
});
