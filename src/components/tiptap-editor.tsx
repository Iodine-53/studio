
'use client'

import { type Editor, EditorContent } from '@tiptap/react'
import Toolbar from './Toolbar'
import { LayoutBubbleMenu } from './LayoutBubbleMenu';
import { BlockActionsMenu } from './BlockActionsMenu';
import 'highlight.js/styles/atom-one-dark.css'

// Define the component's props
type Props = {
  editor: Editor | null;
};


const TiptapEditor = ({ editor }: Props) => {
  return (
    <div className="flex flex-col justify-stretch min-h-[500px] relative">
      {editor && <LayoutBubbleMenu editor={editor} />}
      {editor && <BlockActionsMenu editor={editor} />}
      <Toolbar editor={editor} />
      <EditorContent editor={editor} />
    </div>
  )
}

export default TiptapEditor
