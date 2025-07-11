import { Node, mergeAttributes } from '@tiptap/core';

export const ColumnExtension = Node.create({
  name: 'column',
  group: 'block',
  content: 'block+', // A column can contain any number of block nodes
  defining: true,
  
  parseHTML() {
    return [{ tag: 'div[data-type="column"]' }];
  },

  renderHTML({ HTMLAttributes }) {
    // The '0' allows Tiptap to render the nested content
    return ['div', mergeAttributes(HTMLAttributes, { 'data-type': 'column' }), 0];
  },
});
