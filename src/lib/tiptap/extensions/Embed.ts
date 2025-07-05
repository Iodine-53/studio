
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
