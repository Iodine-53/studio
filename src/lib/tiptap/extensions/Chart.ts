
import { Node, mergeAttributes } from '@tiptap/core';
import { ReactNodeViewRenderer } from '@tiptap/react';
import { ChartNodeView } from '@/components/nodes/ChartNodeView';

export const Chart = Node.create({
  name: 'chartBlock',
  group: 'block',
  atom: true,
  draggable: true,

  addAttributes() {
    return {
      chartType: {
        default: 'bar',
      },
      chartData: {
        default: '[]', 
      },
      chartConfig: {
        default: '{}', 
      },
      title: {
        default: 'My Chart',
      },
      viewConfig: {
        default: '{"legend":true,"tooltip":true,"grid":true}',
      },
      textAlign: {
        default: 'left',
        parseHTML: element => element.getAttribute('data-text-align'),
        renderHTML: attributes => {
          if (attributes.textAlign) {
            return { 'data-text-align': attributes.textAlign }
          }
          return {}
        }
      },
      layout: {
        default: { width: 75 },
        parseHTML: (element) => {
          const layoutAttr = element.getAttribute('data-layout');
          try {
            return layoutAttr ? JSON.parse(layoutAttr) : { width: 75 };
          } catch {
            return { width: 75 };
          }
        },
        renderHTML: (attributes) => ({
          'data-layout': JSON.stringify(attributes.layout),
        }),
      },
    };
  },

  parseHTML() {
    return [{ 
      tag: 'div[data-type="chart-block"]',
    }];
  },

  renderHTML({ HTMLAttributes }) {
    return ['div', mergeAttributes(HTMLAttributes, { 'data-type': 'chart-block' })];
  },

  addNodeView() {
    return ReactNodeViewRenderer(ChartNodeView);
  },
});
