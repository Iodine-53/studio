
'use client'

import React, { useMemo, useState } from 'react'
import type { NodeViewProps } from '@tiptap/react'
import { NodeViewWrapper } from '@tiptap/react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Check, Edit, VideoOff } from 'lucide-react'
import { cn } from '@/lib/utils'

const YOUTUBE_REGEX = /^(?:https?:\/\/)?(?:www\.)?(?:youtube\.com\/(?:watch\?v=|embed\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/
const VIMEO_REGEX = /^(?:https?:\/\/)?(?:www\.)?(?:vimeo\.com\/|player\.vimeo\.com\/video\/)(\d+)/

const getEmbedUrl = (url: string | null): string | null => {
  if (!url) return null

  const youtubeMatch = url.match(YOUTUBE_REGEX)
  if (youtubeMatch && youtubeMatch[1]) {
    return `https://www.youtube.com/embed/${youtubeMatch[1]}`
  }

  const vimeoMatch = url.match(VIMEO_REGEX)
  if (vimeoMatch && vimeoMatch[1]) {
    return `https://player.vimeo.com/video/${vimeoMatch[1]}`
  }

  return null
}

export const EmbedNodeView: React.FC<NodeViewProps> = ({
  node,
  updateAttributes,
  selected,
  editor
}) => {
  const { src, layout } = node.attrs
  const { align, width } = layout || { align: 'center', width: 100 }
  
  const embedUrl = useMemo(() => getEmbedUrl(src), [src])
  
  const [isEditing, setIsEditing] = useState(!src)
  const [inputValue, setInputValue] = useState(src || '')

  const handleSave = () => {
    updateAttributes({ src: inputValue })
    setIsEditing(false)
  }

  const handleWrapperClick = () => {
    if (!isEditing) {
        editor.setEditable(false);
    }
  }

  const handleEditClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsEditing(true);
    editor.setEditable(false);
  }

  const handleDoneClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    handleSave();
    editor.setEditable(true);
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
        e.preventDefault();
        handleDoneClick(e as any);
    }
  }

  return (
    <NodeViewWrapper
      className="layout-wrapper"
      data-align={align}
      onClick={handleWrapperClick}
    >
      <div
        className={cn(
            'my-4 overflow-hidden w-full transition-shadow relative group',
            selected && !isEditing && 'ring-2 ring-primary ring-offset-2 rounded-lg'
        )}
        style={{ maxWidth: typeof width === 'number' ? `${width}%` : '100%' }}
      >
        {isEditing ? (
          <div className="p-4 space-y-2 border rounded-lg bg-card">
            <p className="text-sm font-medium">Embed Video</p>
            <div className="flex gap-2">
              <Input
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Enter YouTube or Vimeo URL..."
                autoFocus
              />
              <Button onClick={handleDoneClick}>
                <Check className="h-4 w-4" />
              </Button>
            </div>
          </div>
        ) : embedUrl ? (
          <div className="relative w-full aspect-video">
            <iframe
              src={embedUrl}
              className="absolute top-0 left-0 w-full h-full border-0 rounded-lg"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            ></iframe>
            <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <Button size="icon" variant="secondary" className="h-8 w-8" onClick={handleEditClick}>
                    <Edit className="h-4 w-4" />
                    <span className="sr-only">Edit URL</span>
                </Button>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center p-4 aspect-video border-2 border-dashed rounded-lg bg-muted/50">
            <VideoOff className="w-10 h-10 text-muted-foreground mb-2" />
            <p className="text-sm text-muted-foreground">Invalid or missing video URL.</p>
            <Button size="sm" variant="outline" className="mt-2" onClick={handleEditClick}>
              <Edit className="mr-2 h-4 w-4"/>
              Edit URL
            </Button>
          </div>
        )}
      </div>
    </NodeViewWrapper>
  )
}
