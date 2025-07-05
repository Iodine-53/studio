
import { Node, mergeAttributes } from '@tiptap/core'
import { ReactNodeViewRenderer } from '@tiptap/react'
import AccordionNodeView from '@/components/nodes/AccordionNodeView'

// Types
export interface AccordionItem {
  id: string
  title: string
  content: string
}

export interface AccordionOptions {
  HTMLAttributes: Record<string, any>
}

// Extend TipTap commands
declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    accordion: {
      /**
       * Insert an accordion
       */
      insertAccordion: (options?: { items?: AccordionItem[]; title?: string; subtitle?: string }) => ReturnType
    }
  }
}

// TipTap Node Extension
export const Accordion = Node.create<AccordionOptions>({
  name: 'accordion',

  group: 'block',

  atom: true,

  draggable: true,

  addOptions() {
    return {
      HTMLAttributes: {},
    }
  },

  addAttributes() {
    return {
      items: {
        default: [
          {
            id: '1',
            title: 'Is this component responsive?',
            content: 'Yes, this accordion is designed to work seamlessly across all devices, from desktop computers to mobile phones.',
          },
          {
            id: '2',
            title: 'How can I customize it?',
            content: 'You can easily customize the accordion by modifying the Tailwind CSS classes in the component and using the app\'s theme.',
          },
          {
            id: '3',
            title: 'Is it accessible?',
            content: 'Yes! This accordion follows web accessibility guidelines with proper ARIA attributes and keyboard navigation support.',
          },
        ],
        parseHTML: (element) => {
          const itemsAttr = element.getAttribute('data-items')
          try {
            return itemsAttr ? JSON.parse(itemsAttr) : []
          } catch {
            return []
          }
        },
        renderHTML: (attributes) => {
          return {
            'data-items': JSON.stringify(attributes.items || []),
          }
        },
      },
      title: {
        default: 'Frequently Asked Questions',
        parseHTML: (element) => element.getAttribute('data-title'),
        renderHTML: (attributes) => {
          return {
            'data-title': attributes.title,
          }
        },
      },
      subtitle: {
        default: 'Everything you need to know, answered.',
        parseHTML: (element) => element.getAttribute('data-subtitle'),
        renderHTML: (attributes) => {
          return {
            'data-subtitle': attributes.subtitle,
          }
        },
      },
      layout: {
        default: {
          width: 75,
        },
      },
    }
  },

  parseHTML() {
    return [
      {
        tag: 'div[data-type="accordion"]',
      },
    ]
  },

  renderHTML({ HTMLAttributes }) {
    // An atom node is a leaf node, so it cannot have a content hole (the '0').
    return ['div', mergeAttributes(HTMLAttributes, { 'data-type': 'accordion' })]
  },

  addNodeView() {
    return ReactNodeViewRenderer(AccordionNodeView)
  },

  addCommands() {
    return {
      insertAccordion:
        (options = {}) =>
        ({ commands }) => {
          const { items, title, subtitle } = options
          return commands.insertContent({
            type: this.name,
            attrs: {
              items: items || undefined,
              title: title || undefined,
              subtitle: subtitle || undefined,
            },
          })
        },
    }
  },
})
