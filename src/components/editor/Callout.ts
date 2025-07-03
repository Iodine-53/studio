import { Node, mergeAttributes } from '@tiptap/core'

export const Callout = Node.create({
  name: 'callout',
  group: 'block',
  content: 'block+', // Can contain other block nodes

  addAttributes() {
    return {
      'data-type': {
        default: 'info',
      },
    }
  },

  parseHTML() {
    return [
      {
        tag: 'div[data-callout]',
      },
    ]
  },

  renderHTML({ HTMLAttributes }) {
    return ['div', mergeAttributes(HTMLAttributes, { 'data-callout': '' }), 0]
  },
  
  addCommands() {
    return {
      toggleCallout:
        () =>
        ({ commands }) => {
          return commands.toggleNode(this.name, 'paragraph')
        },
    }
  },
})
