
import { Node, mergeAttributes } from '@tiptap/core';
import { ReactNodeViewRenderer } from '@tiptap/react';
import { AccordionNodeView } from '@/components/nodes/AccordionNodeView';

// 1. The Parent Container Node
export const Accordion = Node.create({
  name: 'accordion',
  group: 'block',
  content: 'accordionSummary accordionContent', // <-- This is the crucial part
  draggable: true,
  
  parseHTML() {
    return [{ tag: 'accordion-block' }];
  },

  renderHTML({ HTMLAttributes }) {
    return ['accordion-block', mergeAttributes(HTMLAttributes), 0];
  },

  addNodeView() {
    return ReactNodeViewRenderer(AccordionNodeView);
  },
});

// 2. The Child Node for the Title/Summary
export const AccordionSummary = Node.create({
  name: 'accordionSummary',
  content: 'text*', // Only allows text, no other blocks
  group: 'block', 
  defining: true,
  parseHTML() { return [{ tag: 'div[data-type="accordion-summary"]' }]; },
  renderHTML({ HTMLAttributes }) { 
    return ['div', mergeAttributes(HTMLAttributes, { 'data-type': 'accordion-summary' }), 0]; 
  },
});

// 3. The Child Node for the Main Content
export const AccordionContent = Node.create({
  name: 'accordionContent',
  content: 'block+', // Allows any other block inside
  group: 'block',
  defining: true,
  parseHTML() { return [{ tag: 'div[data-type="accordion-content"]' }]; },
  renderHTML({ HTMLAttributes }) { 
    return ['div', mergeAttributes(HTMLAttributes, { 'data-type': 'accordion-content' }), 0]; 
  },
});
