
import { Node, mergeAttributes } from '@tiptap/core'

export interface ImageOptions {
  HTMLAttributes: Record<string, any>
}

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    image: {
      /**
       * Add an image
       */
      setImage: (options: { src: string; alt?: string; title?: string }) => ReturnType
    }
  }
}

export const CustomImage = Node.create<ImageOptions>({
  name: 'image',
  group: 'block',
  draggable: true,
  selectable: true, // Make the node selectable
  atom: true, // Treat as a single unit

  addAttributes() {
    return {
      src: {
        default: null,
      },
      alt: {
        default: null,
      },
      title: {
        default: null,
      },
      // ADD THIS NEW ATTRIBUTE
      layout: {
        default: {
          align: 'center',
          width: 'default',
        },
      },
    }
  },

  parseHTML() {
    return [
      {
        tag: 'div.image-wrapper', // Parse the wrapper div
        getAttrs: (dom: HTMLElement) => {
            const img = dom.querySelector('img');
            return {
                src: img?.getAttribute('src'),
                alt: img?.getAttribute('alt'),
                title: img?.getAttribute('title'),
                layout: {
                    align: dom.getAttribute('data-align'),
                    width: dom.getAttribute('data-width'),
                }
            }
        }
      },
    ]
  },

  renderHTML({ HTMLAttributes }) {
    const { layout = {}, ...restAttrs } = HTMLAttributes;
    // This is the wrapper that will control layout
    return [
      'div',
      {
        'data-align': layout.align,
        'data-width': layout.width,
        class: 'image-wrapper', // Add a class for easy CSS targeting
      },
      // The actual image goes inside
      ['img', mergeAttributes(restAttrs, { class: 'rounded-lg' })]
    ];
  },

  addCommands() {
    return {
      setImage: options => ({ commands }) => {
        return commands.insertContent({
          type: this.name,
          attrs: options,
        })
      },
    }
  },
})
