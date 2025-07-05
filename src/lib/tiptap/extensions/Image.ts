
import { Node, mergeAttributes } from '@tiptap/core';
import { ReactNodeViewRenderer } from '@tiptap/react';
import { ImageNodeView } from '@/components/nodes/ImageNodeView';

export interface ImageOptions {
  HTMLAttributes: Record<string, any>;
}

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    image: {
      /**
       * Add an image
       */
      setImage: (options: { src: string | null; alt?: string; title?: string }) => ReturnType;
    };
  }
}

export const CustomImage = Node.create<ImageOptions>({
  name: 'image',
  group: 'block',
  draggable: true,
  selectable: true,
  atom: true,

  addOptions() {
    return {
      HTMLAttributes: {},
    };
  },

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
          width: 75,
        },
      },
    };
  },

  parseHTML() {
    return [
      {
        tag: 'div.layout-wrapper', // Parse the wrapper div
        getAttrs: (dom: HTMLElement) => {
          const contentWrapper = dom.firstChild as HTMLElement;
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
              width: width,
            },
            textAlign: dom.getAttribute('data-align') || 'center',
          };
        },
      },
    ];
  },

  renderHTML({ HTMLAttributes }) {
    const { layout = {}, textAlign, ...restAttrs } = HTMLAttributes;
    const { width } = layout;

    const wrapperAttrs = {
      'data-align': textAlign,
      class: 'layout-wrapper',
    };

    const imageContainerAttrs = {
      style: `max-width: ${typeof width === 'number' ? `${width}%` : '100%'}`,
    };

    return [
      'div',
      wrapperAttrs,
      ['div', imageContainerAttrs, ['img', mergeAttributes(this.options.HTMLAttributes, restAttrs, { class: 'rounded-lg w-full' })]],
    ];
  },
  
  addCommands() {
    return {
      setImage:
        (options) =>
        ({ commands }) => {
          return commands.insertContent({
            type: this.name,
            attrs: options,
          });
        },
    };
  },

  addNodeView() {
    return ReactNodeViewRenderer(ImageNodeView);
  },
});
