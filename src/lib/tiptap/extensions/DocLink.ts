
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
  atom: true, // Treat the link as a single, atomic unit

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
    // This is the fallback for serialization (e.g., copy-paste, saving).
    // It must return a valid DOM description array.
    return [
      'span',
      mergeAttributes(HTMLAttributes, {
        'data-type': 'doc-link',
        class: 'bg-primary/10 text-primary dark:bg-primary/20 px-2 py-1 rounded-md'
      }),
      HTMLAttributes.label, // The text content of the span
    ];
  },
  
  // This is the correct way to render the interactive React component in the editor.
  addNodeView() {
    return ({ node, editor }) => {
        const span = document.createElement('span');
        span.className = 'bg-primary/10 text-primary dark:bg-primary/20 px-2 py-1 rounded-md cursor-pointer hover:bg-primary/20 transition-colors';
        span.textContent = node.attrs.label;
        span.setAttribute('data-type', 'doc-link');
        span.setAttribute('data-doc-id', node.attrs.docId);

        span.addEventListener('click', (event) => {
          // Allow navigation only when the editor is not editable.
          if (!editor.isEditable) {
            if (node.attrs.docId) {
                window.open(`/editor/${node.attrs.docId}`, '_blank');
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
