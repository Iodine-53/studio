
import { Node, mergeAttributes } from '@tiptap/core'

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    callout: {
      /**
       * Set a callout block
       */
      setCallout: (attributes?: { type: string }) => ReturnType,
      /**
       * Toggle a callout block
       */
      toggleCallout: (attributes?: { type: string }) => ReturnType,
    }
  }
}

export const Callout = Node.create({
  name: 'callout',
  group: 'block',
  content: 'block+', // This node can contain other block nodes
  draggable: true,

  addAttributes() {
    return {
      type: {
        default: 'info',
        parseHTML: element => element.getAttribute('data-type'),
        renderHTML: attributes => {
          return { 'data-type': attributes.type }
        },
      },
    }
  },

  parseHTML() {
    return [
      {
        tag: 'callout-block',
        getAttrs: dom => ({
          type: (dom as HTMLElement).getAttribute('data-type'),
        }),
      },
    ]
  },

  renderHTML({ HTMLAttributes }) {
    // The '0' represents the content hole where child nodes will be rendered
    return ['callout-block', mergeAttributes(HTMLAttributes), 0]
  },

  addCommands() {
    return {
      setCallout: (attributes) => ({ commands }) => {
        return commands.wrapIn(this.name, attributes)
      },
      toggleCallout: (attributes) => ({ commands }) => {
        return commands.toggleWrap(this.name, attributes)
      },
    }
  },
})
