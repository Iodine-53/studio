

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
  onOpenSidebar: () => void;
  isMobile: boolean;
};


const TiptapEditor = ({ editor, onAiAssistantClick, onAddToggleClick, onOpenEquationModal, onOpenSidebar, isMobile }: Props) => {
  
  return (
    <div className="flex flex-col flex-grow relative min-h-0">
      {editor && <LayoutBubbleMenu editor={editor} />}
      
      <div className="sticky top-0 z-20">
          <Toolbar 
            editor={editor} 
            onAiAssistantClick={onAiAssistantClick} 
            onAddToggleClick={onAddToggleClick}
            onOpenEquationModal={onOpenEquationModal}
            onOpenSidebar={onOpenSidebar}
            isMobile={isMobile}
          />
      </div>

      <div className="flex-1 w-full h-full overflow-y-auto">
        <EditorContent editor={editor} />
      </div>
    </div>
  )
}

export default TiptapEditor
