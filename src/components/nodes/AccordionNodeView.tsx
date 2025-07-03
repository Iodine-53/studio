
"use client"

import { NodeViewContent, NodeViewWrapper } from '@tiptap/react'
import { Plus, Minus } from 'lucide-react'
import { useState } from 'react'

export const AccordionNodeView = () => {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <NodeViewWrapper className="my-2 rounded-lg border bg-card group">
      <div
        className="flex cursor-pointer items-center justify-between p-4"
        onClick={() => setIsOpen(!isOpen)}
      >
        {/* The first NodeViewContent is for the title. It's always visible. */}
        <NodeViewContent as="div" className="flex-1 font-medium" />

        {isOpen ? <Minus className="h-5 w-5 text-muted-foreground" /> : <Plus className="h-5 w-5 text-muted-foreground" />}
      </div>

      {isOpen && (
        <div className="border-t border-border p-4">
          {/* The second NodeViewContent is for the content. It's collapsible. */}
          <NodeViewContent as="div" />
        </div>
      )}
    </NodeViewWrapper>
  )
}
