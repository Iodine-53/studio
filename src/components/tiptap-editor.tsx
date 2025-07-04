
'use client'

import { useEffect } from 'react';
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
import { Callout } from '@/lib/tiptap/extensions/Callout'
import { SlashCommand } from './editor/slash-command'
import { CustomImage } from '@/lib/tiptap/extensions/Image';
import TaskList from '@tiptap/extension-task-list'
import TaskItem from '@tiptap/extension-task-item'
import { AdvancedTask } from '@/lib/tiptap/extensions/AdvancedTask';
import { Placeholder } from '@/lib/tiptap/extensions/Placeholder';


// Import a syntax highlighting theme
import 'highlight.js/styles/atom-one-dark.css'

// Register the languages we want to support
lowlight.registerLanguage('html', xml)
lowlight.registerLanguage('css', css)
lowlight.registerLanguage('js', javascript)
lowlight.registerLanguage('ts', typescript)

// Define the component's props
type Props = {
  content?: any;
  onUpdate?: (content: any) => void;
};


const TiptapEditor = ({ content, onUpdate = () => {} }: Props) => {
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        listItem: {
          HTMLAttributes: {
            class: 'leading-normal'
          }
        },
        codeBlock: false,
        image: false, // Disable default image to use our custom one
      }),
      Underline,
      TextAlign.configure({
        types: ['heading', 'paragraph'],
      }),
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
      CustomImage, // Add our custom image extension
      TaskList,
      TaskItem.configure({
        nested: true,
      }),
      AdvancedTask,
      Placeholder,
    ],
    editorProps: {
      attributes: {
        class: 'prose dark:prose-invert prose-sm sm:prose-base lg:prose-lg xl:prose-2xl p-6 focus:outline-none min-h-[350px] w-full',
      },
    },
    // Listen for updates
    onUpdate: ({ editor }) => {
      onUpdate(editor.getJSON());
    },
    content: content || `
      <h1>Welcome to Your Tiptap Editor!</h1>
      <p>This is where the magic happens. Start typing to see it in action.</p>
    `,
  })

  // Use an effect to update the editor content when the initial prop changes
  useEffect(() => {
    if (editor && content && editor.getHTML() !== content) {
      // Use `setContent` to update the editor's content.
      // The `emitUpdate: false` is important to prevent an infinite loop
      // where onUpdate triggers a re-render which triggers setContent again.
      editor.commands.setContent(content, false);
    }
  }, [editor, content]);


  return (
    <div className="flex flex-col justify-stretch min-h-[500px]">
      <Toolbar editor={editor} />
      <EditorContent editor={editor} />
    </div>
  )
}

export default TiptapEditor
