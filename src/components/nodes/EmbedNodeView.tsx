
'use client'

import React, { useMemo, useState, useEffect } from 'react'
import type { NodeViewProps } from '@tiptap/react'
import { NodeViewWrapper } from '@tiptap/react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Check, Edit, Video, Link2 } from 'lucide-react'
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
}) => {
  const { src, textAlign } = node.attrs
  const align = textAlign || 'center';
  
  const embedUrl = useMemo(() => getEmbedUrl(src), [src])
  
  const [isEditing, setIsEditing] = useState(!src)
  const [inputValue, setInputValue] = useState(src || '')

  useEffect(() => {
    // If the node is deselected, exit editing mode, but only if there's a URL saved.
    // This prevents the input from disappearing if you click away before entering a URL.
    if (!selected && src) {
      setIsEditing(false)
    }
  }, [selected, src])


  const handleSave = () => {
    updateAttributes({ src: inputValue })
    setIsEditing(false)
  }

  const handleEditClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsEditing(true);
  }

  const handleDoneClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    handleSave();
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
        e.preventDefault();
        handleDoneClick(e as any);
    }
  }

  return (
    <NodeViewWrapper
      className="my-4"
      data-align={align}
    >
      <div
        className={cn(
            'overflow-hidden w-full transition-shadow relative group',
            selected && !isEditing && 'ring-2 ring-primary ring-offset-2 rounded-lg'
        )}
      >
        {isEditing ? (
          <div className="p-4 space-y-2 border rounded-lg bg-card">
            <p className="text-sm font-medium">Embed Content</p>
            <div className="flex gap-2">
              <Input
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Enter a YouTube or Vimeo URL..."
                autoFocus
              />
              <Button onClick={handleDoneClick}>
                <Check className="h-4 w-4" />
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">Paste a YouTube or Vimeo link and press Enter.</p>
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
        ) : src ? (
            <div className="flex items-center gap-4 p-4 border rounded-lg bg-card hover:bg-muted/50 transition-colors">
                <div className="flex-shrink-0">
                    <Link2 className="w-8 h-8 text-muted-foreground" />
                </div>
                <div className="flex-grow min-w-0">
                    <p className="text-sm font-medium truncate">{src}</p>
                    <a href={src} target="_blank" rel="noopener noreferrer" className="text-xs text-primary underline break-all">
                        Open link in new tab
                    </a>
                </div>
                <div className="flex-shrink-0">
                    <Button size="icon" variant="ghost" className="h-8 w-8" onClick={handleEditClick}>
                        <Edit className="h-4 w-4" />
                        <span className="sr-only">Edit URL</span>
                    </Button>
                </div>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center p-4 aspect-video border-2 border-dashed rounded-lg bg-muted/50">
            <Video className="w-10 h-10 text-muted-foreground mb-2" />
            <p className="text-sm text-muted-foreground">Invalid or missing embed URL.</p>
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
