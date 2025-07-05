
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
      layout: {
        default: {
          align: 'center',
          width: 75,
        },
      },
    }
  },

  parseHTML() {
    return [
      {
        tag: 'div.layout-wrapper', // Parse the wrapper div
        getAttrs: (dom: HTMLElement) => {
          const contentWrapper = dom.firstChild as HTMLElement;
          // Ignore text nodes
          if (!contentWrapper || contentWrapper.nodeType === 3) return false;

          const img = contentWrapper.querySelector('img');
          if (!img) return false;
          
          const widthStyle = contentWrapper.style.maxWidth;
          const width = widthStyle && widthStyle.endsWith('%') ? parseInt(widthStyle, 10) : 75;

          return {
              src: img?.getAttribute('src'),
              alt: img?.getAttribute('alt'),
              title: img?.getAttribute('title'),
              layout: {
                  align: dom.getAttribute('data-align') || 'center',
                  width: width,
              }
          }
        }
      },
    ]
  },

  renderHTML({ HTMLAttributes }) {
    const { layout = {}, ...restAttrs } = HTMLAttributes;
    const { align, width } = layout;

    // The wrapper for alignment
    const wrapperAttrs = {
      'data-align': align,
      class: 'layout-wrapper',
    };

    // The image itself will be inside a container that controls its width
    const imageContainerAttrs = {
      style: `max-width: ${typeof width === 'number' ? `${width}%` : '100%'}`,
    };

    return [
      'div',
      wrapperAttrs,
      ['div', imageContainerAttrs, ['img', mergeAttributes(restAttrs, { class: 'rounded-lg w-full' })]],
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
