
import { Node, mergeAttributes } from '@tiptap/core';
import { ReactNodeViewRenderer } from '@tiptap/react';
import { AccordionNodeView } from '@/components/nodes/AccordionNodeView';

export const Accordion = Node.create({
  name: 'accordion',
  group: 'block',
  content: 'accordionSummary accordionContent', // Defines the two required child nodes
  draggable: true,
  
  parseHTML() {
    return [{ tag: 'accordion-block' }];
  },

  renderHTML({ HTMLAttributes }) {
    // The '0' is the content hole for Tiptap to render children into
    return ['accordion-block', mergeAttributes(HTMLAttributes), 0];
  },

  addNodeView() {
    return ReactNodeViewRenderer(AccordionNodeView);
  },

  addCommands() {
    return {
      setAccordion: () => ({ commands }) => {
        return commands.insertContent(
          `<accordion-block><div data-type="accordion-summary"><p>Summary</p></div><div data-type="accordion-content"><p></p></div></accordion-block>`
        );
      },
    };
  },
});

export const AccordionSummary = Node.create({
  name: 'accordionSummary',
  content: 'inline*', // Allows inline content like bold, italic, etc.
  group: 'block', 
  defining: true,
  parseHTML() { return [{ tag: 'div[data-type="accordion-summary"]' }]; },
  renderHTML({ HTMLAttributes }) { return ['div', mergeAttributes(HTMLAttributes, { 'data-type': 'accordion-summary' }), 0]; },
});

export const AccordionContent = Node.create({
  name: 'accordionContent',
  content: 'block+', // Allows any other block content
  group: 'block',
  defining: true,
  parseHTML() { return [{ tag: 'div[data-type="accordion-content"]' }]; },
  renderHTML({ HTMLAttributes }) { return ['div', mergeAttributes(HTMLAttributes, { 'data-type': 'accordion-content' }), 0]; },
});
