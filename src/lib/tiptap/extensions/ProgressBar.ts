
import { Node, mergeAttributes } from '@tiptap/core';
import { ReactNodeViewRenderer } from '@tiptap/react';
import { ProgressBarNodeView } from '@/components/nodes/ProgressBarNodeView';

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    progressBarBlock: {
      insertProgressBarBlock: (attributes?: any) => ReturnType;
    };
  }
}

export const ProgressBarBlock = Node.create({
  name: 'progressBarBlock',
  group: 'block',
  atom: true,
  draggable: true,

  addAttributes() {
    return {
      title: {
        default: 'Key Metrics',
      },
      items: {
        default: [
          { id: 1, label: 'Metric A', value: 65, color: '#3B82F6' },
          { id: 2, label: 'Metric B', value: 40, color: '#10B981' },
          { id: 3, label: 'Metric C', value: 85, color: '#F59E0B' }
        ],
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
        default: { width: 100 },
        parseHTML: element => {
            const layoutAttr = element.getAttribute('data-layout');
            try {
                return layoutAttr ? JSON.parse(layoutAttr) : { width: 100 };
            } catch {
                return { width: 100 };
            }
        },
        renderHTML: attributes => ({
            'data-layout': JSON.stringify(attributes.layout),
        }),
      },
    };
  },
  
  parseHTML() {
    return [{ 
        tag: 'div[data-type="progress-bar-block"]',
        getAttrs: (dom: HTMLElement) => {
            const itemsAttr = dom.getAttribute('data-items');
            const titleAttr = dom.getAttribute('data-title');
            
            // Handle legacy attributes for backward compatibility
            const oldTitle = dom.getAttribute('data-block-title');
            const oldItems = dom.getAttribute('data-progress-bars');
            
            let items = [];
            if (itemsAttr) {
                items = JSON.parse(itemsAttr);
            } else if (oldItems) {
                // Map old structure to new
                items = JSON.parse(oldItems).map((item: any) => ({
                    id: item.id,
                    label: item.title,
                    value: item.progress,
                    color: item.color
                }));
            }
            
            return {
                title: titleAttr || oldTitle,
                items,
            };
        },
    }];
  },
  
  renderHTML({ HTMLAttributes }) {
    return [
      'div', 
      mergeAttributes(
        { 'data-type': 'progress-bar-block' },
        { 'data-title': HTMLAttributes.title },
        { 'data-items': JSON.stringify(HTMLAttributes.items) }
      )
    ];
  },
  
  addNodeView() {
    return ReactNodeViewRenderer(ProgressBarNodeView);
  },
  
  addCommands() {
    return {
      insertProgressBarBlock: (attributes) => ({ commands }) => {
        return commands.insertContent({
          type: this.name,
          attrs: attributes,
        });
      },
    };
  },
});
