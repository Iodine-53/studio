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
      isCompleted: { default: false },
      dueDate: { default: null },
      category: { default: 'personal' },
      priority: { default: 'medium' },
    };
  },

  parseHTML() {
    return [{ tag: 'advanced-task' }];
  },

  renderHTML({ HTMLAttributes }) {
    // We pass the attributes to the custom element for potential CSS targeting
    return ['advanced-task', mergeAttributes(HTMLAttributes), 0];
  },

  addNodeView() {
    return ReactNodeViewRenderer(AdvancedTaskNodeView);
  },
});
