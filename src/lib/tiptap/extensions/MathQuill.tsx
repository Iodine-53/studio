
import { Node, mergeAttributes } from '@tiptap/core';
import { ReactNodeViewRenderer } from '@tiptap/react';
import dynamic from 'next/dynamic';

const MathQuillNodeView = dynamic(
  () => import('@/components/nodes/MathQuillNodeView').then(mod => mod.MathQuillNodeView),
  {
    ssr: false,
    loading: () => <div className="p-2">Loading Math Editor...</div>
  }
);


declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    mathQuill: {
      insertMathQuill: (attributes?: { latex?: string }) => ReturnType;
    };
  }
}

export const MathQuill = Node.create({
  name: 'mathQuill',
  group: 'inline', // Changed to inline to flow with text
  inline: true,
  atom: true,
  draggable: true,

  addAttributes() {
    return {
      latex: {
        default: 'x=\\frac{-b\\pm\\sqrt{b^2-4ac}}{2a}',
      },
    };
  },
  
  parseHTML() {
    return [{ 
      tag: 'span[data-type="math-quill"]',
      getAttrs: dom => ({
          latex: (dom as HTMLElement).getAttribute('data-latex')
      }),
    }];
  },
  
  renderHTML({ HTMLAttributes }) {
    return ['span', mergeAttributes(HTMLAttributes, { 'data-type': 'math-quill' })];
  },
  
  addNodeView() {
    return ReactNodeViewRenderer(MathQuillNodeView);
  },
  
  addCommands() {
    return {
      insertMathQuill: (attributes) => ({ commands }) => {
        return commands.insertContent({
          type: this.name,
          attrs: attributes,
        });
      },
    };
  },
});
