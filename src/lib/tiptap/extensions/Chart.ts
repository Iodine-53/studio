
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
      layout: {
        default: {
          width: 75,
        },
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
