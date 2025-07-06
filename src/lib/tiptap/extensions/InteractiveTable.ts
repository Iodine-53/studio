
import { Node, mergeAttributes } from '@tiptap/core';
import { ReactNodeViewRenderer } from '@tiptap/react';
import { InteractiveTableNodeView } from '@/components/nodes/InteractiveTableNodeView';

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    interactiveTable: {
      insertInteractiveTable: (options?: { title?: string; data?: string[][]; headers?: string[] }) => ReturnType;
    };
  }
}

export const InteractiveTable = Node.create({
  name: 'interactiveTable',
  group: 'block',
  atom: true,
  draggable: true,

  addAttributes() {
    return {
      title: {
        default: 'My Table',
      },
      headers: {
        default: '["Column 1", "Column 2", "Column 3"]',
      },
      data: {
        default: '[["Row 1, Col 1", "Row 1, Col 2", "Row 1, Col 3"], ["Row 2, Col 1", "Row 2, Col 2", "Row 2, Col 3"]]',
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
    return [{ tag: 'div[data-type="interactive-table"]' }];
  },

  renderHTML({ HTMLAttributes }) {
    return ['div', mergeAttributes(HTMLAttributes, { 'data-type': 'interactive-table' })];
  },

  addNodeView() {
    return ReactNodeViewRenderer(InteractiveTableNodeView);
  },

  addCommands() {
    return {
      insertInteractiveTable:
        (options = {}) =>
        ({ commands }) => {
          return commands.insertContent({
            type: this.name,
            attrs: {
                ...options,
                headers: options.headers ? JSON.stringify(options.headers) : undefined,
                data: options.data ? JSON.stringify(options.data) : undefined,
            },
          });
        },
    };
  },
});
