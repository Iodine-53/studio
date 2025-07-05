
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
      textAlign: {
        default: 'center',
        parseHTML: element => element.getAttribute('data-text-align'),
        renderHTML: attributes => {
          if (attributes.textAlign) {
            return { 'data-text-align': attributes.textAlign }
          }
          return {}
        }
      },
      layout: {
        default: { width: 100 },
        parseHTML: (element) => {
          const layoutAttr = element.getAttribute('data-layout');
          try {
            return layoutAttr ? JSON.parse(layoutAttr) : { width: 100 };
          } catch {
            return { width: 100 };
          }
        },
        renderHTML: (attributes) => ({
          'data-layout': JSON.stringify(attributes.layout),
        }),
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
            return { src };
        },
      },
    ]
  },

  renderHTML({ HTMLAttributes }) {
    const { src, ...restAttrs } = HTMLAttributes;
    
    const embedContainerAttrs = {
        'data-type': 'embed',
        class: 'relative w-full aspect-video', // 16:9 aspect ratio
    };

    return [
      'div', embedContainerAttrs, ['iframe', { src, ...restAttrs, class: 'absolute top-0 left-0 w-full h-full', frameborder: '0', allowfullscreen: 'true' }]
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
