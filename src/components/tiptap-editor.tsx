
'use client'

import { type Editor, EditorContent } from '@tiptap/react'
import Toolbar from './Toolbar'
import { LayoutBubbleMenu } from './LayoutBubbleMenu';
import 'highlight.js/styles/atom-one-dark.css'

// Define the component's props
type Props = {
  editor: Editor | null;
  onAiAssistantClick: () => void;
};


const TiptapEditor = ({ editor, onAiAssistantClick }: Props) => {
  return (
    <div className="flex flex-col flex-grow">
      {editor && <LayoutBubbleMenu editor={editor} />}
      <Toolbar editor={editor} onAiAssistantClick={onAiAssistantClick} />
      <EditorContent editor={editor} className="flex-grow" />
    </div>
  )
}

export default TiptapEditor
