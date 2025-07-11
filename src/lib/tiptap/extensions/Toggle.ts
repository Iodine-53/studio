
import { Node, mergeAttributes } from '@tiptap/core';
import { ReactNodeViewRenderer } from '@tiptap/react';
import ToggleComponent from '@/components/nodes/ToggleComponent';

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    toggle: {
      setToggle: () => ReturnType;
    }
  }
}

export const ToggleExtension = Node.create({
  name: 'toggle',
  group: 'block',
  content: 'block+', // This is the key change: it allows nested blocks.
  defining: true,
  draggable: true,

  addAttributes() {
    return {
      title: { default: 'Toggle' },
      isOpen: { default: true },
    };
  },

  parseHTML() {
    return [{ tag: 'div[data-type="toggle"]' }];
  },

  renderHTML({ HTMLAttributes }) {
    return ['div', mergeAttributes(HTMLAttributes, { 'data-type': 'toggle' }), 0];
  },

  addNodeView() {
    return ReactNodeViewRenderer(ToggleComponent);
  },

  addCommands() {
    return {
      setToggle: () => ({ commands }) => {
        // When inserting, create a toggle with an empty paragraph inside.
        return commands.insertContent({
          type: this.name,
          attrs: { isOpen: true },
          content: [{ type: 'paragraph' }],
        });
      },
    };
  },
});
