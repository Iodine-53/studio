
import { Node, mergeAttributes } from '@tiptap/core'
import { ReactNodeViewRenderer } from '@tiptap/react'
import { EmbedNodeView } from '@/components/nodes/EmbedNodeView'

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    embed: {
      setEmbed: (options: { src: string }) => ReturnType
    }
  }
}

export const Embed = Node.create({
  name: 'embed',
  group: 'block',
  atom: true,
  draggable: true,

  addAttributes() {
    return {
      src: {
        default: null,
      },
      layout: { // Adding layout support for consistency
        default: {
          align: 'center',
          width: 100,
        },
      },
    }
  },

  parseHTML() {
    return [
      {
        tag: 'div[data-type="embed"] iframe',
        getAttrs: (dom: HTMLElement) => {
            const src = dom.getAttribute('src');
            if (!src) return false;
            const wrapper = dom.closest('div[data-type="embed"]');
            const layoutWrapper = wrapper?.parentElement;

            const widthStyle = wrapper?.style.maxWidth;
            const width = widthStyle && widthStyle.endsWith('%') ? parseInt(widthStyle, 10) : 100;

            return {
                src: src,
                layout: {
                    align: layoutWrapper?.getAttribute('data-align') || 'center',
                    width: width,
                }
            }
        },
      },
    ]
  },

  renderHTML({ HTMLAttributes }) {
    const { layout = {}, src, ...restAttrs } = HTMLAttributes;
    const { align, width } = layout;

    const wrapperAttrs = {
      'data-align': align,
      class: 'layout-wrapper',
    };

    const embedContainerAttrs = {
        'data-type': 'embed',
        class: 'relative w-full aspect-video', // 16:9 aspect ratio
        style: `max-width: ${typeof width === 'number' ? `${width}%` : '100%'}`,
    };

    return [
      'div', wrapperAttrs,
      ['div', embedContainerAttrs, ['iframe', { src, ...restAttrs, class: 'absolute top-0 left-0 w-full h-full', frameborder: '0', allowfullscreen: 'true' }]]
    ];
  },

  addCommands() {
    return {
      setEmbed:
        options =>
        ({ commands }) => {
          return commands.insertContent({
            type: this.name,
            attrs: options,
          })
        },
    }
  },

  addNodeView() {
    return ReactNodeViewRenderer(EmbedNodeView)
  },
})
