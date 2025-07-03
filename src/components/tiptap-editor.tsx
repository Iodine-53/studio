'use client'

import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'

const TiptapEditor = () => {
  const editor = useEditor({
    extensions: [
      StarterKit,
    ],
    content: `
      <h1>Welcome to Your Tiptap Editor!</h1>
      <p>This is where the magic happens. Start typing to see it in action.</p>
    `,
    editorProps: {
      attributes: {
        class: 'prose dark:prose-invert prose-sm sm:prose-base lg:prose-lg xl:prose-2xl p-6 focus:outline-none min-h-[400px] w-full',
      },
    },
  })

  return (
    <EditorContent editor={editor} />
  )
}

export default TiptapEditor
