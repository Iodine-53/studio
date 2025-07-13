

'use client'

import { type Editor, EditorContent } from '@tiptap/react'
import Toolbar from './Toolbar'
import { LayoutBubbleMenu } from './LayoutBubbleMenu';
import { useMediaQuery } from '@/hooks/use-media-query';
import { MobileToolbar } from './MobileToolbar';
import 'highlight.js/styles/atom-one-dark.css'
import { motion, AnimatePresence } from 'framer-motion';

type Props = {
  editor: Editor | null;
  isEditorFocused: boolean;
  onAiAssistantClick: () => void;
  onAddToggleClick: () => void;
  onOpenEquationModal: () => void;
};


const TiptapEditor = ({ editor, isEditorFocused, onAiAssistantClick, onAddToggleClick, onOpenEquationModal }: Props) => {
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

      <AnimatePresence>
        {isMobile && isEditorFocused && (
          <motion.div
            initial={{ y: 100 }}
            animate={{ y: 0 }}
            exit={{ y: 100 }}
            transition={{ type: "spring", stiffness: 400, damping: 30 }}
            className="fixed bottom-0 left-0 right-0 z-20"
          >
            <MobileToolbar
              editor={editor} 
              onAiAssistantClick={onAiAssistantClick}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

export default TiptapEditor

    