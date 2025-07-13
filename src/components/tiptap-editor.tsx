

'use client'

import { type Editor, EditorContent } from '@tiptap/react'
import Toolbar from './Toolbar'
import { LayoutBubbleMenu } from './LayoutBubbleMenu';
import 'highlight.js/styles/atom-one-dark.css'
import { motion, AnimatePresence } from "framer-motion";
import MobileToolbar from './MobileToolbar';

type Props = {
  editor: Editor | null;
  onAiAssistantClick: () => void;
  onAddToggleClick: () => void;
  onOpenEquationModal: () => void;
  onOpenSidebar: () => void;
  isMobile: boolean;
  isEditorFocused: boolean;
};


const TiptapEditor = ({ editor, onAiAssistantClick, onAddToggleClick, onOpenEquationModal, onOpenSidebar, isMobile, isEditorFocused }: Props) => {
  
  return (
    <div className="flex flex-col flex-grow relative min-h-0">
      {editor && <LayoutBubbleMenu editor={editor} />}
      
      {!isMobile && (
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
            className="fixed bottom-0 left-0 right-0 z-10"
          >
            <MobileToolbar editor={editor} />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

export default TiptapEditor
