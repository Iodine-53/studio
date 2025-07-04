import { Node, mergeAttributes } from '@tiptap/core';
import { ReactNodeViewRenderer } from '@tiptap/react';
import { AdvancedTaskNodeView } from '@/components/nodes/AdvancedTaskNodeView';

export interface AdvancedTaskOptions {
  HTMLAttributes: Record<string, any>;
}

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    advancedTask: {
      /**
       * Insert an advanced task
       */
      insertAdvancedTask: (attributes?: {
        isCompleted?: boolean;
        dueDate?: string | null;
        category?: string;
        priority?: string;
      }) => ReturnType;
      /**
       * Toggle advanced task completion
       */
      toggleAdvancedTask: () => ReturnType;
    };
  }
}

export const AdvancedTask = Node.create<AdvancedTaskOptions>({
  name: 'advancedTask',
  group: 'block',
  content: 'text*',
  draggable: true,
  selectable: true,
  atom: false,

  addOptions() {
    return {
      HTMLAttributes: {},
    };
  },

  addAttributes() {
    return {
      isCompleted: {
        default: false,
        parseHTML: (element) => element.getAttribute('data-completed') === 'true',
        renderHTML: (attributes) => ({
          'data-completed': attributes.isCompleted,
        }),
      },
      dueDate: {
        default: null,
        parseHTML: (element) => element.getAttribute('data-due-date'),
        renderHTML: (attributes) => ({
          'data-due-date': attributes.dueDate,
        }),
      },
      category: {
        default: 'personal',
        parseHTML: (element) => element.getAttribute('data-category') || 'personal',
        renderHTML: (attributes) => ({
          'data-category': attributes.category,
        }),
      },
      priority: {
        default: 'medium',
        parseHTML: (element) => element.getAttribute('data-priority') || 'medium',
        renderHTML: (attributes) => ({
          'data-priority': attributes.priority,
        }),
      },
    };
  },

  parseHTML() {
    return [
      {
        tag: 'advanced-task',
        priority: 51,
      },
    ];
  },

  renderHTML({ HTMLAttributes, node }) {
    return [
      'advanced-task',
      mergeAttributes(this.options.HTMLAttributes, HTMLAttributes, {
        class: 'advanced-task-wrapper',
      }),
      0,
    ];
  },

  addCommands() {
    return {
      insertAdvancedTask:
        (attributes = {}) =>
        ({ chain, state }) => {
            return chain()
              .focus()
              .insertContent({
                type: this.name,
                content: [{ type: 'text', text: 'New Task' }],
                attrs: {
                  isCompleted: false,
                  dueDate: null,
                  category: 'personal',
                  priority: 'medium',
                  ...attributes,
                },
              })
              .run();
        },

      toggleAdvancedTask:
        () =>
        ({ commands, editor }) => {
          return commands.updateAttributes(this.name, {
            isCompleted: !editor.getAttributes(this.name).isCompleted,
          });
        },
    };
  },

  addKeyboardShortcuts() {
    return {
      'Mod-Shift-t': () => this.editor.commands.insertAdvancedTask(),
      'Mod-Enter': () => {
        if (this.editor.isActive(this.name)) {
          return this.editor.commands.toggleAdvancedTask();
        }
        return false;
      },
    };
  },

  addNodeView() {
    return ReactNodeViewRenderer(AdvancedTaskNodeView, {
      contentDOMElementTag: 'span',
      update: (node, decorations) => {
        return node.type.name === this.name;
      },
    });
  },
});
