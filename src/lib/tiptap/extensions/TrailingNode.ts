
import { Extension } from '@tiptap/core'
import { Plugin, PluginKey } from '@tiptap/pm/state'

/**
 * An array of node types that should be followed by a paragraph.
 * These are typically "atom" or complex block-level nodes that a user
 * can't easily type after.
 * Since we are removing most complex blocks, this list is now empty,
 * but the extension remains useful for any custom blocks added in the future.
 */
const trailingNodeTypes: string[] = []

export const TrailingNode = Extension.create({
  name: 'trailingNode',

  addProseMirrorPlugins() {
    return [
      new Plugin({
        key: new PluginKey('trailingNode'),
        appendTransaction: (_, __, state) => {
          const { doc, tr, schema } = state
          const lastNode = doc.lastChild
          const endPosition = doc.content.size

          if (lastNode && trailingNodeTypes.includes(lastNode.type.name)) {
            // If the last node is one of our designated types,
            // we append a new paragraph node after it.
            // This transaction is created and returned, ensuring it's part of the
            // normal Tiptap state update cycle.
            return tr.insert(endPosition, schema.nodes.paragraph.create())
          }

          // If no change is needed, return null.
          return null
        },
      }),
    ]
  },
})
