
import { Node, mergeAttributes } from '@tiptap/core';
import { ReactNodeViewRenderer } from '@tiptap/react';
import { AdvancedTaskNodeView } from '@/components/nodes/AdvancedTaskNodeView';
import AdvancedTodoListComponent from '@/components/nodes/AdvancedTodoListComponent';
import { v4 as uuidv4 } from 'uuid';

// ---------------------------
// 1. The Container Node: AdvancedTodoList
// ---------------------------

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
  content: 'advancedTask+', // Can ONLY contain advancedTask nodes
  
  addAttributes() {
    return {
      blockId: {
        default: null,
        parseHTML: element => element.getAttribute('data-block-id'),
        renderHTML: attributes => ({ 'data-block-id': attributes.blockId }),
      },
      textAlign: {
        default: 'left',
        parseHTML: element => element.getAttribute('data-text-align') || 'left',
        renderHTML: attributes => ({ 'data-text-align': attributes.textAlign }),
      },
      layout: {
        default: { width: 100 },
        parseHTML: element => {
          const layoutAttr = element.getAttribute('data-layout');
          return layoutAttr ? JSON.parse(layoutAttr) : { width: 100 };
        },
        renderHTML: attributes => ({ 'data-layout': JSON.stringify(attributes.layout) }),
      },
      fontSize: { default: null },
      color: { default: null },
      backgroundColor: { default: null },
    };
  },
  
  parseHTML() {
    return [{ tag: 'div[data-type="advanced-todo-list"]' }];
  },

  renderHTML({ HTMLAttributes }) {
    return ['div', mergeAttributes(HTMLAttributes, { 'data-type': 'advanced-todo-list' }), 0];
  },

  addNodeView() {
    return ReactNodeViewRenderer(AdvancedTodoListComponent);
  },

  addCommands() {
    return {
      insertAdvancedTodoList: () => ({ chain }) => {
        return chain().insertContent({
          type: this.name,
          attrs: { blockId: uuidv4() },
          content: [
            { type: 'advancedTask', content: [{ type: 'text', text: 'First task' }] },
            { type: 'advancedTask', content: [{ type: 'text', text: 'Second task' }] },
          ],
        }).run();
      },
    };
  },
});


// ---------------------------
// 2. The Item Node: AdvancedTask
// ---------------------------

export const AdvancedTaskExtension = Node.create({
  name: 'advancedTask',
  content: 'text*',
  group: 'block', // Each task is a block within the list
  defining: true,

  addAttributes() {
    return {
      isCompleted: {
        default: false,
      },
      dueDate: {
        default: null,
      },
      priority: {
        default: 'medium', // e.g., 'low', 'medium', 'high'
      },
      category: {
        default: 'personal', // e.g., 'work', 'personal'
      },
    };
  },

  parseHTML() {
    return [{
      tag: 'div[data-type="advanced-task"]',
      getAttrs: dom => ({
        isCompleted: (dom as HTMLElement).dataset.completed === 'true',
        dueDate: (dom as HTMLElement).dataset.dueDate || null,
        priority: (dom as HTMLElement).dataset.priority || 'medium',
        category: (dom as HTMLElement).dataset.category || 'personal',
      }),
    }];
  },

  renderHTML({ node, HTMLAttributes }) {
    return [
      'div',
      mergeAttributes(HTMLAttributes, {
        'data-type': 'advanced-task',
        'data-completed': node.attrs.isCompleted,
        'data-due-date': node.attrs.dueDate,
        'data-priority': node.attrs.priority,
        'data-category': node.attrs.category,
      }),
      0 // Content hole
    ];
  },
  
  addNodeView() {
    return ReactNodeViewRenderer(AdvancedTaskNodeView);
  }
});
