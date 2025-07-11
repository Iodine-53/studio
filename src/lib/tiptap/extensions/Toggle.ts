
import { Node, mergeAttributes } from '@tiptap/core';
import { ReactNodeViewRenderer } from '@tiptap/react';
import ToggleComponent from '@/components/nodes/ToggleComponent';

const getTemplateContent = (type: string) => {
  switch (type) {
    case 'checklist':
      return [{
        type: 'taskList',
        content: [
          { type: 'taskItem', attrs: { checked: false }, content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Task 1' }] }] },
          { type: 'taskItem', attrs: { checked: false }, content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Task 2' }] }] },
        ],
      }];
    case 'notes':
      return [{ type: 'paragraph', content: [{ type: 'text', text: 'Add your notes here...' }] }];
    case 'links':
      return [{
          type: 'bulletList',
          content: [
              { type: 'listItem', content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Link 1' }] }] },
              { type: 'listItem', content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Link 2' }] }] }
          ]
      }];
    case 'goals':
        return [{ type: 'paragraph', content: [{ type: 'text', text: '🎯 Goal: ' }] }];
    case 'ideas':
        return [{ type: 'paragraph', content: [{ type: 'text', text: '💡 Idea: ' }] }];
    default: // 'blank'
      return [{ type: 'paragraph' }];
  }
};

const TEMPLATE_TITLES: { [key: string]: string } = {
  checklist: '✅ Checklist',
  notes: '📋 Notes',
  links: '🔗 Links & Resources',
  ideas: '💡 Ideas',
  goals: '🎯 Goals',
  blank: '📝 Toggle',
};


declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    toggle: {
      setToggle: (options?: { type: string }) => ReturnType;
    }
  }
}

export const ToggleExtension = Node.create({
  name: 'toggle',
  group: 'block',
  content: 'block+',
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
      setToggle: (options) => ({ commands }) => {
        const type = options?.type || 'blank';
        return commands.insertContent({
          type: this.name,
          attrs: { 
            isOpen: true,
            title: TEMPLATE_TITLES[type] || 'Toggle',
          },
          content: getTemplateContent(type),
        });
      },
    };
  },
});
