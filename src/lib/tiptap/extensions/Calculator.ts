
import { Node, mergeAttributes } from '@tiptap/core';
import { ReactNodeViewRenderer } from '@tiptap/react';
import { CalculatorNodeView } from '@/components/nodes/CalculatorNodeView';

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    calculator: {
      insertCalculator: () => ReturnType;
    };
  }
}

export const Calculator = Node.create({
  name: 'calculator',
  group: 'block',
  atom: true,
  draggable: true,

  parseHTML() {
    return [{ tag: 'div[data-type="calculator-widget"]' }];
  },
  
  renderHTML({ HTMLAttributes }) {
    return ['div', mergeAttributes(HTMLAttributes, { 'data-type': 'calculator-widget' })];
  },
  
  addNodeView() {
    return ReactNodeViewRenderer(CalculatorNodeView);
  },
  
  addCommands() {
    return {
      insertCalculator: () => ({ commands }) => {
        return commands.insertContent({
          type: this.name,
        });
      },
    };
  },
});
