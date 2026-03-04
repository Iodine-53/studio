
"use client";

import { type FC } from 'react';
import { type Document } from '@/lib/db';
import { TagInput } from './TagInput';
import { MetadataEditor } from './MetadataEditor';
import { Separator } from './ui/separator';
import { ScrollArea } from './ui/scroll-area';
import { Button } from './ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from './ui/dropdown-menu';
import { BookOpen, Braces, Download, Eye, FileCode2, FileText, History } from 'lucide-react';

type EditorSidebarProps = {
  doc: Document;
  tags: string[];
  onTagsChange: (newTags: string[]) => void;
  onMetadataUpdate: (newMetadata: Record<string, string>) => void;
  onHistoryClick: () => void;
  onPreviewClick: () => void;
  onExportDocxClick: () => void;
  onExportJsonClick: () => void;
  onExportHtmlClick: () => void;
  onExportMarkdownClick: () => void;
};

export const EditorSidebar: FC<EditorSidebarProps> = ({ 
    doc, 
    tags, 
    onTagsChange, 
    onMetadataUpdate, 
    onHistoryClick,
    onPreviewClick,
    onExportDocxClick,
    onExportJsonClick,
    onExportHtmlClick,
    onExportMarkdownClick,
}) => {
  return (
    <div className="h-full flex flex-col bg-card border-r">
        <div className="p-4 border-b">
            <h2 className="text-lg font-semibold leading-none tracking-tight truncate font-headline">{doc.title}</h2>
        </div>
        <div className="p-2 border-b flex justify-around">
             <Button variant="ghost" size="sm" onClick={onHistoryClick}>
                <History className="h-4 w-4 mr-2" /> History
             </Button>
             <Button variant="ghost" size="sm" onClick={onPreviewClick}>
                <Eye className="h-4 w-4 mr-2" /> Preview
             </Button>
            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm">
                        <Download className="h-4 w-4 mr-2" /> Export
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={onExportDocxClick}><FileText className="mr-2 h-4 w-4" />Export as DOCX</DropdownMenuItem>
                    <DropdownMenuItem onClick={onExportJsonClick}><Braces className="mr-2 h-4 w-4" />Export as JSON</DropdownMenuItem>
                    <DropdownMenuItem onClick={onExportHtmlClick}><FileCode2 className="mr-2 h-4 w-4" />Export as HTML</DropdownMenuItem>
                    <DropdownMenuItem onClick={onExportMarkdownClick}><BookOpen className="mr-2 h-4 w-4" />Export as Markdown</DropdownMenuItem>
                </DropdownMenuContent>
            </DropdownMenu>
        </div>
        <ScrollArea className="flex-1">
            <div className="p-4 space-y-6">
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
