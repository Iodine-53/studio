
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
  isMobile: boolean;
  isSidebarOpen: boolean;
  onToggleSidebar: () => void;
};


const TiptapEditor = ({ 
  editor, 
  onAiAssistantClick, 
  onAddToggleClick, 
  onOpenEquationModal, 
  isMobile,
  isSidebarOpen,
  onToggleSidebar
}: Props) => {
  
  return (
    <div className="flex flex-col flex-grow relative min-h-0 bg-background">
      {editor && <LayoutBubbleMenu editor={editor} />}
      
      <div className="sticky top-0 z-20">
          <Toolbar 
            editor={editor} 
            onAiAssistantClick={onAiAssistantClick} 
            onAddToggleClick={onAddToggleClick}
            onOpenEquationModal={onOpenEquationModal}
            isMobile={isMobile}
            isSidebarOpen={isSidebarOpen}
            onToggleSidebar={onToggleSidebar}
          />
      </div>

      <div className="flex-1 w-full h-full overflow-y-auto">
        <EditorContent editor={editor} />
      </div>
    </div>
  )
}

export default TiptapEditor
