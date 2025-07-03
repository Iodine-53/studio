
'use client'

import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Toolbar from './Toolbar'
import Underline from '@tiptap/extension-underline'
import TextAlign from '@tiptap/extension-text-align'
import { CodeBlockLowlight } from '@tiptap/extension-code-block-lowlight'
import { lowlight } from 'lowlight'
import css from 'highlight.js/lib/languages/css'
import javascript from 'highlight.js/lib/languages/javascript'
import typescript from 'highlight.js/lib/languages/typescript'
import xml from 'highlight.js/lib/languages/xml' // for html
import Table from '@tiptap/extension-table'
import TableCell from '@tiptap/extension-table-cell'
import TableHeader from '@tiptap/extension-table-header'
import TableRow from '@tiptap/extension-table-row'
import { Callout } from './editor/Callout'
import { SlashCommand } from './editor/slash-command'


// Import a syntax highlighting theme
import 'highlight.js/styles/atom-one-dark.css'

// Register the languages we want to support
lowlight.registerLanguage('html', xml)
lowlight.registerLanguage('css', css)
lowlight.registerLanguage('js', javascript)
lowlight.registerLanguage('ts', typescript)

const TiptapEditor = () => {
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        listItem: {
          HTMLAttributes: {
            class: 'leading-normal'
          }
        },
        // The CodeBlock extension is part of StarterKit, so we need to disable it
        // to avoid conflicts with our custom CodeBlockLowlight extension.
        codeBlock: false,
      }),
      Underline,
      TextAlign.configure({
        types: ['heading', 'paragraph'],
      }),
       // Add the configured CodeBlockLowlight extension
      CodeBlockLowlight.configure({
        lowlight,
      }),
      Table.configure({
        resizable: true,
      }),
      TableRow,
      TableHeader,
      TableCell,
      Callout,
      SlashCommand,
    ],
    content: `
      <h1>Welcome to Your Tiptap Editor!</h1>
      <p>This is where the magic happens. Type '/' on a new line for commands.</p>
    `,
    editorProps: {
      attributes: {
        class: 'prose dark:prose-invert prose-sm sm:prose-base lg:prose-lg xl:prose-2xl p-6 focus:outline-none min-h-[350px] w-full',
      },
    },
  })

  return (
    <div className="flex flex-col justify-stretch">
      <Toolbar editor={editor} />
      <EditorContent editor={editor} />
    </div>
  )
}

export default TiptapEditor
