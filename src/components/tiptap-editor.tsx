

'use client'

import { type Editor, EditorContent } from '@tiptap/react'
import Toolbar from './Toolbar'
import { LayoutBubbleMenu } from './LayoutBubbleMenu';
import 'highlight.js/styles/atom-one-dark.css'

type Props = {
  editor: Editor | null;
  onAiAssistantClick: () => void;
  onAddToggleClick: () => void;
  onOpenEquationModal: () => void;
};


const TiptapEditor = ({ editor, onAiAssistantClick, onAddToggleClick, onOpenEquationModal }: Props) => {
  return (
    <div className="flex flex-col flex-grow relative min-h-0">
      {editor && <LayoutBubbleMenu editor={editor} />}
      
      <Toolbar 
        editor={editor} 
        onAiAssistantClick={onAiAssistantClick} 
        onAddToggleClick={onAddToggleClick}
        onOpenEquationModal={onOpenEquationModal}
      />

      <div className="flex-grow overflow-y-auto">
        <EditorContent editor={editor} />
      </div>
    </div>
  )
}

export default TiptapEditor
