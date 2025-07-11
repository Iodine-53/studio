
'use client'

import { type Editor, EditorContent } from '@tiptap/react'
import Toolbar from './Toolbar'
import { LayoutBubbleMenu } from './LayoutBubbleMenu';
import 'highlight.js/styles/atom-one-dark.css'

// Define the component's props
type Props = {
  editor: Editor | null;
  onAiAssistantClick: () => void;
  onAddToggleClick: () => void;
};


const TiptapEditor = ({ editor, onAiAssistantClick, onAddToggleClick }: Props) => {
  return (
    // This component now handles the layout of the toolbar and editor content area
    <div className="flex flex-col flex-grow overflow-hidden">
      {editor && <LayoutBubbleMenu editor={editor} />}
      
      {/* Toolbar is sticky at the top of this container */}
      <Toolbar editor={editor} onAiAssistantClick={onAiAssistantClick} onAddToggleClick={onAddToggleClick} />

      {/* Editor content area is scrollable */}
      <div className="flex-grow overflow-y-auto">
        <EditorContent editor={editor} />
      </div>
    </div>
  )
}

export default TiptapEditor
