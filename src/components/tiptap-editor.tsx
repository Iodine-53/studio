'use client'

import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'

const TiptapEditor = () => {
  const editor = useEditor({
    extensions: [
      StarterKit,
    ],
    content: `
      <h1>Document Maker</h1>
      <p>Start creating your document here. You can use standard formatting options like bold, italics, and lists.</p>
      <ul>
        <li>Item 1</li>
        <li>Item 2</li>
      </ul>
      <p>Unleash your productivity!</p>
    `,
    editorProps: {
      attributes: {
        class: 'prose dark:prose-invert prose-sm sm:prose-base lg:prose-lg focus:outline-none w-full max-w-none p-6',
      },
    },
  })

  return (
    <EditorContent editor={editor} />
  )
}

export default TiptapEditor
