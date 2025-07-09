
import { Node, mergeAttributes } from '@tiptap/core'
import { ReactNodeViewRenderer } from '@tiptap/react'
import { DualBlockNodeView } from '@/components/nodes/DualBlockNodeView'

// TipTap Node Definition
export const DualBlockNode = Node.create({
  name: 'layoutBlock',
  group: 'block',
  content: 'block block', // Expects two block content nodes for the two columns
  draggable: true,

  addAttributes() {
    return {
      leftWidth: {
        default: 50,
      },
      textAlign: {
        default: 'center',
        parseHTML: element => element.getAttribute('data-text-align'),
        renderHTML: attributes => {
          if (attributes.textAlign) {
            return { 'data-text-align': attributes.textAlign }
          }
          return {}
        }
      },
      layout: {
        default: { width: 100 },
        parseHTML: (element) => {
          const layoutAttr = element.getAttribute('data-layout');
          try {
            return layoutAttr ? JSON.parse(layoutAttr) : { width: 100 };
          } catch {
            return { width: 100 };
          }
        },
        renderHTML: (attributes) => ({
          'data-layout': JSON.stringify(attributes.layout),
        }),
      },
    }
  },

  parseHTML() {
    return [
      {
        tag: 'div[data-type="layout-block"]',
      },
    ]
  },

  renderHTML({ HTMLAttributes }) {
    return ['div', mergeAttributes(HTMLAttributes, { 'data-type': 'layout-block' }), 0]
  },

  addNodeView() {
    return ReactNodeViewRenderer(DualBlockNodeView)
  },

  addCommands() {
    return {
      insertDualBlock: (attributes = {}) => ({ commands }) => {
        return commands.insertContent({
          type: this.name,
          attrs: attributes,
          // Start with two empty paragraphs, one for each column
          content: [
            { type: 'paragraph' },
            { type: 'paragraph' },
          ],
        })
      },
    }
  },
})
