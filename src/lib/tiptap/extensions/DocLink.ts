
import { Node, mergeAttributes } from '@tiptap/core';

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    docLink: {
      setDocLink: (options: { docId: string; label: string }) => ReturnType;
    }
  }
}

export const DocLinkExtension = Node.create({
  name: 'docLink',
  group: 'inline',
  inline: true,
  atom: true,

  addAttributes() {
    return {
      docId: {
        default: null,
        parseHTML: element => element.getAttribute('data-doc-id'),
        renderHTML: attributes => ({ 'data-doc-id': attributes.docId }),
      },
      label: {
        default: 'Untitled Link',
        parseHTML: element => element.getAttribute('data-label'),
        renderHTML: attributes => ({ 'data-label': attributes.label }),
      },
    };
  },

  parseHTML() {
    return [{ tag: 'span[data-type="doc-link"]' }];
  },

  renderHTML({ HTMLAttributes }) {
    // The node view will handle the rendering, this is a fallback.
    return [
      'span',
      mergeAttributes(HTMLAttributes, {
        'data-type': 'doc-link',
      }),
      this.options.HTMLAttributes.label,
    ];
  },
  
  addNodeView() {
    return ({ node, editor }) => {
        const span = document.createElement('span');
        span.className = 'bg-primary/10 text-primary dark:bg-primary/20 px-2 py-1 rounded-md cursor-pointer hover:bg-primary/20 transition-colors';
        span.textContent = node.attrs.label;
        span.setAttribute('data-type', 'doc-link');
        span.setAttribute('data-doc-id', node.attrs.docId);

        span.addEventListener('click', () => {
          // Navigate to the linked document when clicked
          if (node.attrs.docId) {
            window.location.href = `/editor/${node.attrs.docId}`;
          }
        });

        return {
            dom: span,
        };
    };
  },

  addCommands() {
    return {
      setDocLink: (attributes) => ({ commands }) => {
        return commands.insertContent({
          type: this.name,
          attrs: attributes,
        });
      },
    };
  },
});
