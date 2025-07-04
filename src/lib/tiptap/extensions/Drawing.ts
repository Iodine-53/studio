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
    }
  },

  parseHTML() {
    return [
      {
        tag: 'div[data-type="sketch-canvas"]',
        getAttrs: (dom: HTMLElement) => ({
            paths: dom.getAttribute('data-paths'),
        }),
      },
    ]
  },

  renderHTML({ HTMLAttributes }) {
    return ['div', mergeAttributes(HTMLAttributes, { 'data-type': 'sketch-canvas', 'data-paths': HTMLAttributes.paths })]
  },

  addNodeView() {
    return ReactNodeViewRenderer(DrawingNodeView)
  },
})
