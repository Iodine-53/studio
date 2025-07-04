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
      }
    };
  },

  parseHTML() {
    return [{ 
      tag: 'div[data-type="chart-block"]',
      getAttrs: dom => {
        const element = dom as HTMLElement;
        return {
          chartType: element.getAttribute('data-chart-type'),
          chartData: element.getAttribute('data-chart-data'),
          chartConfig: element.getAttribute('data-chart-config'),
          title: element.getAttribute('data-title'),
          viewConfig: element.getAttribute('data-view-config'),
        }
      }
    }];
  },

  renderHTML({ HTMLAttributes }) {
    return ['div', mergeAttributes(HTMLAttributes, { 
        'data-type': 'chart-block',
        'data-chart-type': HTMLAttributes.chartType,
        'data-chart-data': HTMLAttributes.chartData,
        'data-chart-config': HTMLAttributes.chartConfig,
        'data-title': HTMLAttributes.title,
        'data-view-config': HTMLAttributes.viewConfig
    })];
  },

  addNodeView() {
    return ReactNodeViewRenderer(ChartNodeView);
  },
});
