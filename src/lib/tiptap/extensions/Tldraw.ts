import { Node, mergeAttributes } from '@tiptap/core'
import { ReactNodeViewRenderer } from '@tiptap/react'
import { TldrawNodeView } from '@/components/nodes/TldrawNodeView'

export const Tldraw = Node.create({
  name: 'tldraw',
  group: 'block',
  atom: true, // Treat as a single, indivisible unit
  draggable: true,

  addAttributes() {
    return {
      data: {
        default: null,
      },
    }
  },

  parseHTML() {
    return [
      {
        tag: 'div[data-type="tldraw"]',
        getAttrs: (dom: HTMLElement) => ({
          data: JSON.parse(dom.getAttribute('data-tldraw') || 'null'),
        }),
      },
    ]
  },

  renderHTML({ HTMLAttributes }) {
    // The '0' is a content hole, but since this is an atom, it will be empty.
    // We store the data as a stringified attribute for persistence.
    return ['div', mergeAttributes({ 'data-type': 'tldraw', 'data-tldraw': JSON.stringify(HTMLAttributes.data) }), 0]
  },

  addNodeView() {
    return ReactNodeViewRenderer(TldrawNodeView)
  },

  addCommands() {
    return {
      setTldraw:
        () =>
        ({ commands }) => {
          return commands.insertContent({ type: this.name })
        },
    }
  },
})
