
import { Node, mergeAttributes } from '@tiptap/core';
import { ReactNodeViewRenderer } from '@tiptap/react';
import { ToggleNodeView } from '@/components/nodes/ToggleNodeView';

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    toggle: {
      /**
       * Set a toggle block with a specific template
       */
      setToggle: (attributes?: { type?: string }) => ReturnType;
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
      type: { // For templating
        default: 'blank',
      }
    };
  },

  parseHTML() {
    return [
      {
        tag: 'div[data-type="toggle-block"]',
        contentElement: 'div.toggle-content',
        getAttrs: dom => ({
          title: (dom as HTMLElement).getAttribute('data-title'),
          isOpen: (dom as HTMLElement).getAttribute('data-is-open') === 'true',
          type: (dom as HTMLElement).getAttribute('data-toggle-type'),
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
        'data-is-open': String(node.attrs.isOpen),
        'data-toggle-type': node.attrs.type,
      }),
      ['div', { class: 'toggle-header' }, node.attrs.title],
      ['div', { class: 'toggle-content' }, 0], // Content hole
    ];
  },

  addNodeView() {
    return ReactNodeViewRenderer(ToggleNodeView);
  },

  addCommands() {
    return {
      setToggle:
        (attributes = { type: 'blank' }) =>
        ({ commands }) => {
          const { type } = attributes;
          
          const templates = {
            blank: { title: '📝 Blank Toggle', content: [{ type: 'paragraph' }] },
            notes: { title: '📋 Notes', content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Add your notes here...' }] }] },
            links: { title: '🔗 Links & Resources', content: [{ type: 'bulletList', content: [{ type: 'listItem', content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Link 1' }] }] }] }] },
            ideas: { title: '💡 Ideas', content: [{ type: 'bulletList', content: [{ type: 'listItem', content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Idea 1' }] }] }] }] },
            goals: { title: '🎯 Goals', content: [{ type: 'taskList', content: [{ type: 'taskItem', attrs: { checked: false }, content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Goal 1'}] }] }] }] },
            checklist: { title: '✅ Checklist', content: [{ type: 'taskList', content: [{ type: 'taskItem', attrs: { checked: false }, content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Task 1'}] }] }] }] },
          };
          
          const template = templates[type as keyof typeof templates] || templates.blank;

          return commands.insertContent({
            type: this.name,
            attrs: {
              title: template.title,
              isOpen: true,
              type: type
            },
            content: template.content,
          });
        },
    };
  },
});
