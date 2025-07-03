
"use client"

import { NodeViewContent, NodeViewWrapper } from '@tiptap/react'
import { ChevronRight } from 'lucide-react'
import { useState } from 'react'
import { cn } from '@/lib/utils'

export const AccordionNodeView = () => {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <NodeViewWrapper className="my-4 rounded-lg border bg-card group">
      <div
        className="flex cursor-pointer items-center justify-between p-4"
        onClick={() => setIsOpen(!isOpen)}
      >
        <div className="flex items-center gap-2 flex-1">
          <ChevronRight
            className={cn(
              'h-4 w-4 text-muted-foreground transition-transform duration-200',
              isOpen && 'rotate-90'
            )}
          />
          <div className="flex-1">
            {/* This first NodeViewContent renders the 'accordionSummary' */}
            <NodeViewContent as="div" />
          </div>
        </div>
      </div>
      {isOpen && (
        <div className="border-t border-border px-4 pt-2 pb-4">
          {/* This second NodeViewContent renders the 'accordionContent' */}
          <NodeViewContent as="div" />
        </div>
      )}
    </NodeViewWrapper>
  )
}
