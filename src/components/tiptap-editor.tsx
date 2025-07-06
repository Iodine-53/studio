
'use client'

import { type Editor, EditorContent } from '@tiptap/react'
import Toolbar from './Toolbar'
import { BlockActionsMenu } from './BlockActionsMenu';
import { LayoutBubbleMenu } from './LayoutBubbleMenu';
import 'highlight.js/styles/atom-one-dark.css'

// Define the component's props
type Props = {
  editor: Editor | null;
};


const TiptapEditor = ({ editor }: Props) => {
  return (
    <div className="flex h-full flex-col justify-stretch relative">
      {editor && <BlockActionsMenu editor={editor} />}
      {editor && <LayoutBubbleMenu editor={editor} />}
      <Toolbar editor={editor} />
      <EditorContent editor={editor} className="flex-1 overflow-y-auto" />
    </div>
  )
}

export default TiptapEditor
