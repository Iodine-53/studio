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
      tldrawState: {
        default: null,
      },
    }
  },

  parseHTML() {
    return [{ tag: 'drawing-block' }]
  },

  renderHTML({ HTMLAttributes }) {
    return ['drawing-block', mergeAttributes(HTMLAttributes)]
  },

  addNodeView() {
    return ReactNodeViewRenderer(DrawingNodeView)
  },
})
