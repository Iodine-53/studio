
import { Node, mergeAttributes } from '@tiptap/core';
import { ReactNodeViewRenderer } from '@tiptap/react';
import { AdvancedTaskNodeView } from '@/components/nodes/AdvancedTaskNodeView';

export const AdvancedTask = Node.create({
  name: 'advancedTask',
  group: 'block',
  content: 'text*',
  draggable: true,

  addAttributes() {
    return {
      dueDate: { 
        default: null,
        parseHTML: element => element.getAttribute('data-due-date'),
        renderHTML: attributes => {
          if (!attributes.dueDate) {
            return {}
          }
          return { 'data-due-date': attributes.dueDate }
        },
      },
      category: { 
        default: 'personal',
        parseHTML: element => element.getAttribute('data-category'),
        renderHTML: attributes => ({ 'data-category': attributes.category }),
      },
      priority: { 
        default: 'medium',
        parseHTML: element => element.getAttribute('data-priority'),
        renderHTML: attributes => ({ 'data-priority': attributes.priority }),
      },
      isCompleted: { 
        default: false,
        parseHTML: element => element.getAttribute('data-is-completed') === 'true',
        renderHTML: attributes => ({ 'data-is-completed': attributes.isCompleted.toString() }),
       },
    };
  },

  parseHTML() {
    return [{ tag: 'div[data-type="advanced-task"]' }];
  },

  renderHTML({ HTMLAttributes }) {
    return ['div', mergeAttributes(HTMLAttributes, { 'data-type': 'advanced-task' }), 0];
  },

  addCommands() {
    return {
      setAdvancedTask: () => ({ commands }) => {
        return commands.insertContent({
          type: this.name,
          content: [{ type: 'text', text: 'New Task' }],
        });
      },
    };
  },

  addNodeView() {
    return ReactNodeViewRenderer(AdvancedTaskNodeView);
  },
});
