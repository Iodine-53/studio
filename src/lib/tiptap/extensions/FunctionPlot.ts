
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
      textAlign: {
        default: 'center',
        parseHTML: element => element.getAttribute('data-text-align'),
        renderHTML: attributes => {
          if (attributes.textAlign) {
            return { 'data-text-align': attributes.textAlign };
          }
          return {};
        },
      },
      layout: {
        default: { width: 100, height: 300 },
        parseHTML: element => {
            const layoutAttr = element.getAttribute('data-layout');
            try {
                return layoutAttr ? JSON.parse(layoutAttr) : { width: 100, height: 300 };
            } catch {
                return { width: 100, height: 300 };
            }
        },
        renderHTML: attributes => ({
            'data-layout': JSON.stringify(attributes.layout),
        }),
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
