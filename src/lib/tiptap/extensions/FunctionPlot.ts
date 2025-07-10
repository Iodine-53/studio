
import { Node, mergeAttributes } from '@tiptap/core';
import { ReactNodeViewRenderer } from '@tiptap/react';
import { FunctionPlotNodeView } from '@/components/nodes/FunctionPlotNodeView';

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    functionPlot: {
      insertFunctionPlot: (attributes?: any) => ReturnType;
    };
  }
}

export const FunctionPlot = Node.create({
  name: 'functionPlot',
  group: 'block',
  atom: true,
  draggable: true,

  addAttributes() {
    return {
      fn: {
        default: 'x^2',
      },
      xDomain: {
        default: [-10, 10],
      },
      yDomain: {
        default: [-1, 10],
      },
      width: {
        default: 500,
      },
      height: {
        default: 300,
      },
    };
  },
  
  parseHTML() {
    return [{ tag: 'div[data-type="function-plot"]' }];
  },
  
  renderHTML({ HTMLAttributes }) {
    return ['div', mergeAttributes(HTMLAttributes, { 'data-type': 'function-plot' })];
  },
  
  addNodeView() {
    return ReactNodeViewRenderer(FunctionPlotNodeView);
  },
  
  addCommands() {
    return {
      insertFunctionPlot: (attributes) => ({ commands }) => {
        return commands.insertContent({
          type: this.name,
          attrs: attributes,
        });
      },
    };
  },
});
