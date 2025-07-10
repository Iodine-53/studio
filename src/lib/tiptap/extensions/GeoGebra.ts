
import { Node, mergeAttributes } from '@tiptap/core';
import { ReactNodeViewRenderer } from '@tiptap/react';
import { GeoGebraNodeView } from '@/components/nodes/GeoGebraNodeView';

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    geogebra: {
      insertGeoGebra: (options?: Record<string, any>) => ReturnType;
    };
  }
}

export const GeoGebra = Node.create({
  name: 'geogebra',
  group: 'block',
  atom: true,
  draggable: true,

  addAttributes() {
    return {
      ggbBase64: {
        default: null,
      },
      appName: {
        default: 'geometry', // geometry, graphing, classic, whiteboard
      },
      width: {
        default: 800,
      },
      height: {
        default: 600,
      },
      showToolBar: {
        default: true,
      },
      showMenuBar: {
        default: false,
      },
      showAlgebraInput: {
        default: true,
      },
      textAlign: {
        default: 'center',
        parseHTML: element => element.getAttribute('data-text-align'),
        renderHTML: attributes => ({ 'data-text-align': attributes.textAlign }),
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
    };
  },

  parseHTML() {
    return [{
      tag: 'div[data-type="geogebra-block"]',
      getAttrs: dom => {
        const ggbBase64 = (dom as HTMLElement).getAttribute('data-ggb-base64');
        return {
          ggbBase64: ggbBase64 || null,
          appName: (dom as HTMLElement).getAttribute('data-app-name') || 'geometry',
          width: parseInt((dom as HTMLElement).getAttribute('data-width') || '800', 10),
          height: parseInt((dom as HTMLElement).getAttribute('data-height') || '600', 10),
          showToolBar: (dom as HTMLElement).getAttribute('data-show-toolbar') === 'true',
          showMenuBar: (dom as HTMLElement).getAttribute('data-show-menubar') === 'true',
          showAlgebraInput: (dom as HTMLElement).getAttribute('data-show-algebra') === 'true',
        };
      },
    }];
  },

  renderHTML({ HTMLAttributes }) {
    return ['div', mergeAttributes(HTMLAttributes, {
      'data-type': 'geogebra-block',
      'data-ggb-base64': HTMLAttributes.ggbBase64,
      'data-app-name': HTMLAttributes.appName,
      'data-width': HTMLAttributes.width,
      'data-height': HTMLAttributes.height,
      'data-show-toolbar': HTMLAttributes.showToolBar,
      'data-show-menubar': HTMLAttributes.showMenuBar,
      'data-show-algebra': HTMLAttributes.showAlgebraInput,
    })];
  },

  addNodeView() {
    return ReactNodeViewRenderer(GeoGebraNodeView);
  },

  addCommands() {
    return {
      insertGeoGebra: (options) => ({ commands }) => {
        return commands.insertContent({
          type: this.name,
          attrs: options,
        });
      },
    };
  },
});
