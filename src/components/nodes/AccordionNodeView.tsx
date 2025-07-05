
'use client'

import React, { useState, useCallback } from 'react'
import type { NodeViewProps } from '@tiptap/react'
import { NodeViewWrapper } from '@tiptap/react'
import { ChevronDown, Plus, X, GripVertical } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card'
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { cn } from '@/lib/utils'

// Types
export interface AccordionItemData {
  id: string
  title: string
  content: string
}

const AccordionNodeView: React.FC<NodeViewProps> = ({
  node,
  updateAttributes,
  selected,
}) => {
  const { items, title, subtitle, layout } = node.attrs;
  const { align, width } = layout || {};
  const [isEditing, setIsEditing] = useState(false)

  const addItem = useCallback(() => {
    const newItem: AccordionItemData = {
      id: Date.now().toString(),
      title: 'New Question',
      content: 'New answer...',
    }
    updateAttributes({ items: [...items, newItem] })
  }, [items, updateAttributes])

  const removeItem = useCallback((itemId: string) => {
    const updatedItems = items.filter((item: AccordionItemData) => item.id !== itemId)
    updateAttributes({ items: updatedItems })
  }, [items, updateAttributes])

  const updateItem = useCallback((itemId: string, field: 'title' | 'content', value: string) => {
    const updatedItems = items.map((item: AccordionItemData) =>
      item.id === itemId ? { ...item, [field]: value } : item
    )
    updateAttributes({ items: updatedItems })
  }, [items, updateAttributes])

  const updateHeader = useCallback((field: 'title' | 'subtitle', value: string) => {
    updateAttributes({ [field]: value })
  }, [updateAttributes])

  return (
    <NodeViewWrapper
      className="layout-wrapper"
      data-align={align}
      data-width={width}
    >
      <Card className={cn('my-4 overflow-hidden', selected && 'ring-2 ring-primary ring-offset-2')}>
        <CardHeader className="bg-muted/30">
          {isEditing ? (
            <div className="space-y-2">
              <Input
                value={title}
                onChange={(e) => updateHeader('title', e.target.value)}
                className="text-2xl font-bold font-headline border-0 shadow-none focus-visible:ring-0 p-0 h-auto"
                placeholder="Accordion Title"
              />
              <Input
                value={subtitle}
                onChange={(e) => updateHeader('subtitle', e.target.value)}
                className="text-base text-muted-foreground border-0 shadow-none focus-visible:ring-0 p-0 h-auto"
                placeholder="Accordion Subtitle"
              />
            </div>
          ) : (
            <div>
              <CardTitle className="font-headline">{title}</CardTitle>
              <CardDescription>{subtitle}</CardDescription>
            </div>
          )}
        </CardHeader>

        {selected && (
            <div className="p-2 bg-muted/50 border-b flex justify-between items-center">
                <Button
                onClick={() => setIsEditing(!isEditing)}
                variant="ghost"
                size="sm"
                >
                {isEditing ? 'Finish Editing' : 'Edit Content'}
                </Button>
                {isEditing && (
                    <Button
                    onClick={addItem}
                    variant="ghost"
                    size="sm"
                    className="flex items-center gap-2"
                    >
                    <Plus size={16} />
                    Add Item
                    </Button>
                )}
            </div>
        )}

        <CardContent className="p-0">
            <Accordion type="multiple" className="w-full">
                {items.map((item: AccordionItemData) => (
                    <AccordionItem value={item.id} key={item.id} className="border-b-0">
                         <div className="flex items-center group w-full pr-6 border-b">
                            <AccordionTrigger className="flex-1 hover:no-underline p-6">
                                {isEditing ? (
                                    <Input
                                        value={item.title}
                                        onClick={(e) => e.stopPropagation()}
                                        onChange={(e) => updateItem(item.id, 'title', e.target.value)}
                                        className="font-semibold text-base"
                                    />
                                ) : (
                                    <span className="font-semibold text-left">{item.title}</span>
                                )}
                            </AccordionTrigger>

                            {isEditing && (
                                <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => removeItem(item.id)}
                                className="text-destructive h-8 w-8 ml-2"
                                >
                                <X size={16} />
                                </Button>
                            )}
                         </div>

                        <AccordionContent className="p-6 pt-2 bg-primary/5">
                        {isEditing ? (
                            <Textarea
                                value={item.content}
                                onChange={(e) => updateItem(item.id, 'content', e.target.value)}
                                className="w-full bg-background border-border rounded-md resize-y"
                                rows={3}
                                placeholder="Enter content..."
                            />
                        ) : (
                            <div className="text-foreground/80 leading-relaxed prose prose-sm max-w-none">
                            {item.content.split('\n').map((line, i) => (
                                <p key={i}>{line}</p>
                            ))}
                            </div>
                        )}
                        </AccordionContent>
                    </AccordionItem>
                ))}
            </Accordion>
        </CardContent>
         {items.length === 0 && (
          <div className="p-8 text-center text-muted-foreground">
            <p>No accordion items yet. Select this block and click "Edit Content" to get started.</p>
          </div>
        )}
      </Card>
    </NodeViewWrapper>
  )
}

export default AccordionNodeView;
