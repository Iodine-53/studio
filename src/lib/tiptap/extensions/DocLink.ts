
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
  atom: true, // Treat the link as a single, indivisible unit

  addAttributes() {
    return {
      docId: {
        default: null,
        parseHTML: element => element.getAttribute('data-doc-id'),
        renderHTML: attributes => ({ 'data-doc-id': attributes.docId }),
      },
      label: {
        default: 'Untitled Link',
        parseHTML: element => element.getAttribute('data-label') || element.innerText,
        renderHTML: attributes => ({ 'data-label': attributes.label }),
      },
    };
  },

  parseHTML() {
    return [{ tag: 'span[data-type="doc-link"]' }];
  },

  renderHTML({ HTMLAttributes }) {
    // When using a NodeView, renderHTML should return a simple container.
    // The NodeView's `dom` property will be mounted inside this container.
    return [
      'span',
      mergeAttributes(HTMLAttributes, {
        'data-type': 'doc-link',
      })
    ];
  },
  
  addNodeView() {
    return ({ node, editor }) => {
        const span = document.createElement('span');
        span.className = 'bg-primary/10 text-primary dark:bg-primary/20 px-2 py-1 rounded-md cursor-pointer hover:bg-primary/20 transition-colors';
        span.textContent = node.attrs.label;
        
        span.addEventListener('click', (event) => {
          // Allow navigation only when the editor is not editable.
          if (!editor.isEditable) {
            if (node.attrs.docId) {
                // Use a robust way to open a new tab that works across browsers
                const newWindow = window.open(`/editor/${node.attrs.docId}`, '_blank');
                if (newWindow) newWindow.focus();
            }
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
