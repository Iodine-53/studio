
"use client";

import { type FC } from 'react';
import { type Document } from '@/lib/db';
import { TagInput } from './TagInput';
import { MetadataEditor } from './MetadataEditor';
import { Separator } from './ui/separator';
import { ScrollArea } from './ui/scroll-area';

type EditorSidebarProps = {
  doc: Document;
  tags: string[];
  onTagsChange: (newTags: string[]) => void;
  onMetadataUpdate: (newMetadata: Record<string, string>) => void;
};

export const EditorSidebar: FC<EditorSidebarProps> = ({ doc, tags, onTagsChange, onMetadataUpdate }) => {
  return (
    <div className="h-full bg-card/50 border-l">
        <ScrollArea className="h-full p-4">
            <div className="space-y-6">
                <div>
                    <h3 className="text-sm font-semibold text-muted-foreground mb-2">Tags</h3>
                    <TagInput value={tags} onChange={onTagsChange} />
                </div>
                
                <Separator />

                <div>
                    <h3 className="text-sm font-semibold text-muted-foreground mb-2">Properties</h3>
                    <MetadataEditor
                        initialMetadata={doc.metadata || {}}
                        onUpdate={onMetadataUpdate}
                    />
                </div>
            </div>
        </ScrollArea>
    </div>
  );
};
