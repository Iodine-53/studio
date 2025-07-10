
import { Node, mergeAttributes } from '@tiptap/core'
import { ReactNodeViewRenderer } from '@tiptap/react'
import { DualBlockNodeView } from '@/components/nodes/DualBlockNodeView'

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    dualBlock: {
      insertDualBlock: () => ReturnType;
    };
  }
}

export const DualBlockNode = Node.create({
  name: 'layoutBlock',
  group: 'block',
  content: 'block block', // THIS IS THE KEY: it expects two separate block nodes as content
  draggable: true,
  isolating: true, // Prevents content from being accidentally moved out of the columns

  parseHTML() {
    return [
      {
        tag: 'div[data-type="layout-block"]',
      },
    ]
  },

  renderHTML({ HTMLAttributes }) {
    // The '0' is the content hole where Tiptap will render the child nodes.
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
          // When creating the block, we must provide two empty paragraphs for the content.
          content: [
            { type: 'paragraph' },
            { type: 'paragraph' },
          ],
        })
      },
    }
  },
})
