import { Node, mergeAttributes } from '@tiptap/core';
import { ReactNodeViewRenderer } from '@tiptap/react';
import { PlaceholderNodeView } from '@/components/nodes/PlaceholderNodeView';

export const Placeholder = Node.create({
  name: 'placeholder',
  group: 'block',
  atom: true, // Treat as a single, indivisible unit

  addAttributes() {
    return {
      type: { default: 'advancedTask' },
    };
  },

  parseHTML() { return [{ tag: 'placeholder-block' }] },
  renderHTML({ HTMLAttributes }) { return ['placeholder-block', mergeAttributes(HTMLAttributes)] },

  addNodeView() {
    return ReactNodeViewRenderer(PlaceholderNodeView);
  },
});
