
import { Node, mergeAttributes } from '@tiptap/core';
import { ReactNodeViewRenderer } from '@tiptap/react';
import { ToggleNodeView } from '@/components/nodes/ToggleNodeView';

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    toggle: {
      /**
       * Set a toggle block
       */
      setToggle: () => ReturnType;
    };
  }
}

export const Toggle = Node.create({
  name: 'toggle',
  group: 'block',
  content: 'block+', // Allow block content inside
  draggable: true,
  defining: true,

  addAttributes() {
    return {
      title: {
        default: 'Toggle',
      },
      isOpen: {
        default: false,
      },
    };
  },

  parseHTML() {
    return [
      {
        tag: 'div[data-type="toggle-block"]',
        getAttrs: dom => ({
          title: (dom as HTMLElement).getAttribute('data-title'),
          isOpen: (dom as HTMLElement).getAttribute('data-is-open') === 'true',
        }),
      },
    ];
  },

  renderHTML({ node, HTMLAttributes }) {
    return [
      'div',
      mergeAttributes(HTMLAttributes, {
        'data-type': 'toggle-block',
        'data-title': node.attrs.title,
        'data-is-open': node.attrs.isOpen,
      }),
      ['div', { class: 'toggle-header' }, node.attrs.title],
      ['div', { class: 'toggle-content', style: `display: ${node.attrs.isOpen ? 'block' : 'none'};` }, 0], // Content hole
    ];
  },

  addNodeView() {
    return ReactNodeViewRenderer(ToggleNodeView);
  },

  addCommands() {
    return {
      setToggle:
        () =>
        ({ commands }) => {
          return commands.insertContent({
            type: this.name,
            content: [{
              type: 'paragraph', // Add a default paragraph inside
            }]
          });
        },
    };
  },
});
