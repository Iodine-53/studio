import { Node, mergeAttributes } from '@tiptap/core';

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    columns: {
      insertColumns: (options?: { layout?: string }) => ReturnType;
    }
  }
}

export const ColumnsExtension = Node.create({
  name: 'columns',
  group: 'block',
  content: 'column+', // Can only contain 'column' nodes
  defining: true,
  draggable: true,

  addAttributes() {
    return {
      layout: {
        default: '50-50',
      },
    };
  },

  parseHTML() {
    return [{ tag: 'div[data-type="columns"]' }];
  },

  renderHTML({ HTMLAttributes }) {
    return ['div', mergeAttributes(HTMLAttributes, { 'data-type': 'columns' }), 0];
  },

  addCommands() {
    return {
      insertColumns: (options) => ({ commands }) => {
        return commands.insertContent({
          type: this.name,
          attrs: {
            layout: options?.layout || '50-50',
          },
          content: [
            { type: 'column', content: [{ type: 'paragraph' }] },
            { type: 'column', content: [{ type: 'paragraph' }] },
          ],
        });
      },
    };
  },
});
