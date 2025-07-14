
import { Node, mergeAttributes } from '@tiptap/core';
import { ReactNodeViewRenderer } from '@tiptap/react';
import AdvancedTodoListComponent from '@/components/nodes/AdvancedTodoListComponent';
import { v4 as uuidv4 } from 'uuid';

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    advancedTodoList: {
      insertAdvancedTodoList: () => ReturnType;
    }
  }
}

export const AdvancedTodoListExtension = Node.create({
  name: 'advancedTodoList',
  group: 'block',
  atom: true,
  draggable: true,

  addAttributes() {
    return {
      blockId: {
        default: null,
        parseHTML: element => element.getAttribute('data-block-id'),
        renderHTML: attributes => ({ 'data-block-id': attributes.blockId }),
      },
      textAlign: {
        default: 'left',
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
        parseHTML: (element) => {
          const layoutAttr = element.getAttribute('data-layout');
          try {
            return layoutAttr ? JSON.parse(layoutAttr) : { width: 100 };
          } catch {
            return { width: 100 };
          }
        },
        renderHTML: (attributes) => ({
          'data-layout': JSON.stringify(attributes.layout),
        }),
      },
    };
  },

  parseHTML() {
    return [{ tag: 'div[data-type="advanced-todo-list"]' }];
  },

  renderHTML({ HTMLAttributes }) {
    return ['div', mergeAttributes(HTMLAttributes, { 'data-type': 'advanced-todo-list' })];
  },

  addNodeView() {
    return ReactNodeViewRenderer(AdvancedTodoListComponent);
  },

  addCommands() {
    return {
      insertAdvancedTodoList: () => ({ commands }) => {
        const id = uuidv4();
        return commands.insertContent({
          type: this.name,
          attrs: { blockId: id },
        });
      },
    };
  },
});
