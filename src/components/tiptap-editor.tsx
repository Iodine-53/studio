

'use client'

import { type Editor, EditorContent } from '@tiptap/react'
import Toolbar from './Toolbar'
import { LayoutBubbleMenu } from './LayoutBubbleMenu';
import { useMediaQuery } from '@/hooks/use-media-query';
import { MobileToolbar } from './MobileToolbar';
import 'highlight.js/styles/atom-one-dark.css'

type Props = {
  editor: Editor | null;
  onAiAssistantClick: () => void;
  onAddToggleClick: () => void;
  onOpenEquationModal: () => void;
};


const TiptapEditor = ({ editor, onAiAssistantClick, onAddToggleClick, onOpenEquationModal }: Props) => {
  const isMobile = useMediaQuery('(max-width: 768px)');
  
  return (
    <div className="flex flex-col flex-grow relative min-h-0">
      {editor && <LayoutBubbleMenu editor={editor} />}
      
      {!isMobile && (
         <Toolbar 
            editor={editor} 
            onAiAssistantClick={onAiAssistantClick} 
            onAddToggleClick={onAddToggleClick}
            onOpenEquationModal={onOpenEquationModal}
          />
      )}

      <div className="flex-1 w-full h-full overflow-y-auto">
        <EditorContent editor={editor} />
      </div>

      {isMobile && (
          <MobileToolbar
            editor={editor} 
            onAiAssistantClick={onAiAssistantClick}
          />
      )}
    </div>
  )
}

export default TiptapEditor
