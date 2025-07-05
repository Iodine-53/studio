
import { Node, mergeAttributes } from '@tiptap/core'
import { ReactNodeViewRenderer } from '@tiptap/react'
import { DrawingNodeView } from '@/components/nodes/DrawingNodeView'

export const Drawing = Node.create({
  name: 'drawing',
  group: 'block',
  atom: true,
  draggable: true,

  addAttributes() {
    return {
      paths: {
        default: '[]',
      },
      layout: {
        default: {
          width: 75,
        },
      },
    }
  },

  parseHTML() {
    return [
      {
        tag: 'div[data-type="sketch-canvas"]',
      },
    ]
  },

  renderHTML({ HTMLAttributes }) {
    return ['div', mergeAttributes(HTMLAttributes, { 'data-type': 'sketch-canvas' })]
  },

  addNodeView() {
    return ReactNodeViewRenderer(DrawingNodeView)
  },
})
