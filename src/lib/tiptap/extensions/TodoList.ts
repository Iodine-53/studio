
import { Node, mergeAttributes } from '@tiptap/core'
import { ReactNodeViewRenderer } from '@tiptap/react'
import TodoListComponent from '@/components/nodes/TodoListComponent'

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    todoList: {
      insertTodoList: () => ReturnType
    }
  }
}

export const TodoListExtension = Node.create({
  name: 'todoList',
  group: 'block',
  atom: true,
  draggable: true,

  addAttributes() {
    return {
      title: {
        default: 'My Tasks',
        parseHTML: (element) => element.getAttribute('data-title'),
        renderHTML: (attributes) => {
          return {
            'data-title': attributes.title,
          };
        },
      },
      tasks: {
        default: [{ id: 1, text: 'Your first task', completed: false }],
        parseHTML: element => {
          const tasks = element.getAttribute('data-tasks')
          return tasks ? JSON.parse(tasks) : []
        },
        renderHTML: attributes => {
          return {
            'data-tasks': JSON.stringify(attributes.tasks),
          }
        },
      },
      textAlign: {
        default: 'center',
        parseHTML: element => element.getAttribute('data-text-align'),
        renderHTML: attributes => {
          if (attributes.textAlign) {
            return { 'data-text-align': attributes.textAlign }
          }
          return {}
        }
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
    }
  },

  parseHTML() {
    return [
      {
        tag: 'div[data-type="todo-list"]',
      },
    ]
  },

  renderHTML({ HTMLAttributes }) {
    return ['div', mergeAttributes(HTMLAttributes, { 'data-type': 'todo-list' })]
  },

  addNodeView() {
    return ReactNodeViewRenderer(TodoListComponent)
  },

  addCommands() {
    return {
      insertTodoList: () => ({ commands }) => {
        return commands.insertContent({
          type: this.name,
          attrs: {
            tasks: [],
          },
        })
      },
    }
  },
})
