
'use client'

import { type Editor, EditorContent } from '@tiptap/react'
import Toolbar from './Toolbar'
import { LayoutBubbleMenu } from './LayoutBubbleMenu';
import 'highlight.js/styles/atom-one-dark.css'

// Define the component's props
type Props = {
  editor: Editor | null;
};


const TiptapEditor = ({ editor }: Props) => {
  return (
    <div className="flex flex-1 flex-col justify-stretch relative">
      {editor && <LayoutBubbleMenu editor={editor} />}
      <Toolbar editor={editor} />
      <EditorContent editor={editor} className="flex-1" />
    </div>
  )
}

export default TiptapEditor
