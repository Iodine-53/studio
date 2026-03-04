import { Node, textInputRule, mergeAttributes } from '@tiptap/core';
import { ReactNodeViewRenderer } from '@tiptap/react';
import MathComponent from '@/components/nodes/MathComponent';

// 1. The Inline Math Node
// Usage: Type $ formula $ to trigger
export const InlineMath = Node.create({
  name: 'inlineMath',
  group: 'inline',
  inline: true,
  atom: true,

  addAttributes() {
    return {
      content: {
        default: '',
      },
    };
  },

  parseHTML() {
    return [{ tag: 'span[data-type="inline-math"]' }];
  },

  renderHTML({ HTMLAttributes }) {
    return ['span', mergeAttributes(HTMLAttributes, { 'data-type': 'inline-math' })];
  },

  addNodeView() {
    return ReactNodeViewRenderer(MathComponent);
  },

  addInputRules() {
    return [
      textInputRule({
        find: /\$([^$]+)\$$/,
        replace: (match) => {
          return { type: this.name, attrs: { content: match[1] } };
        },
      }),
    ];
  },
});

// 2. The Block Math Node
// Usage: Type $$ followed by a space to trigger
export const MathBlock = Node.create({
  name: 'mathBlock',
  group: 'block',
  atom: true,
  draggable: true,

  addAttributes() {
    return {
      content: {
        default: '',
      },
      textAlign: {
        default: 'center',
        parseHTML: (element) => element.style.textAlign || element.getAttribute('data-text-align') || 'center',
        renderHTML: (attributes) => ({
          style: `text-align: ${attributes.textAlign}`,
          'data-text-align': attributes.textAlign,
        }),
      },
    };
  },

  parseHTML() {
    return [{ tag: 'div[data-type="math-block"]' }];
  },

  renderHTML({ HTMLAttributes }) {
    return ['div', mergeAttributes(HTMLAttributes, { 'data-type': 'math-block' })];
  },

  addNodeView() {
    return ReactNodeViewRenderer(MathComponent);
  },

  addCommands() {
    return {
      insertMathBlock: (attributes) => ({ commands }) => {
        return commands.insertContent({
          type: this.name,
          attrs: {
            content: attributes?.content || '',
            textAlign: attributes?.textAlign || 'center',
          },
        });
      },
    };
  },

  addInputRules() {
    return [
      textInputRule({
        find: /^\$\$\s$/,
        replace: () => ({ type: this.name }),
      }),
    ];
  },
});
