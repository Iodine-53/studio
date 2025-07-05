
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
        default: [],
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
      layout: {
        default: {
          align: 'center',
          width: 'default',
        },
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
