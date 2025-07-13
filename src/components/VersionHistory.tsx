
"use client";

import { useState, useEffect } from 'react';
import type { Editor } from '@tiptap/react';
import { format } from 'date-fns';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import { Loader2 } from 'lucide-react';
import { type DocumentVersion, getVersionsForDoc, addDocVersion } from '@/lib/db';
import { DocumentRenderer, TiptapNode } from '@/components/PrintPreview';

type Props = {
  isOpen: boolean;
  onClose: () => void;
  docId: number;
  editor: Editor | null;
};

export function VersionHistory({ isOpen, onClose, docId, editor }: Props) {
  const [versions, setVersions] = useState<DocumentVersion[]>([]);
  const [selectedVersion, setSelectedVersion] = useState<DocumentVersion | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isRestoring, setIsRestoring] = useState(false);

  useEffect(() => {
    if (isOpen) {
      const fetchVersions = async () => {
        setIsLoading(true);
        const fetchedVersions = await getVersionsForDoc(docId);
        setVersions(fetchedVersions);
        if (fetchedVersions.length > 0) {
            setSelectedVersion(fetchedVersions[0]);
        }
        setIsLoading(false);
      };
      fetchVersions();
    }
  }, [isOpen, docId]);

  const handleRestore = async () => {
    if (!selectedVersion || !editor) return;

    setIsRestoring(true);
    try {
        // Update the editor with the selected version's content
        editor.commands.setContent(selectedVersion.content);

        // Add a new version entry for this restore action
        const restoreTitle = `Restored from version on ${format(selectedVersion.timestamp, 'PPpp')}`;
        await addDocVersion({ docId, title: restoreTitle, content: selectedVersion.content });
        
        onClose(); // Close the sidebar after restoring
    } catch(error) {
        console.error("Failed to restore version:", error);
    } finally {
        setIsRestoring(false);
    }
  };

  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent className="w-full sm:w-[90vw] md:w-[70vw] lg:max-w-4xl p-0 flex flex-col">
        <SheetHeader className="p-6 border-b">
          <SheetTitle className="text-2xl font-headline">Version History</SheetTitle>
          <SheetDescription>
            Browse and restore previous versions of your document.
          </SheetDescription>
        </SheetHeader>
        <div className="flex-1 grid grid-cols-1 md:grid-cols-3 min-h-0">
          <div className="col-span-1 border-r">
            <ScrollArea className="h-full">
              <div className="p-4 space-y-2">
                {isLoading ? (
                  Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-12 w-full" />)
                ) : versions.length > 0 ? (
                  versions.map((version) => (
                    <button
                      key={version.id}
                      onClick={() => setSelectedVersion(version)}
                      className={`w-full text-left p-2 rounded-md transition-colors ${selectedVersion?.id === version.id ? 'bg-primary text-primary-foreground' : 'hover:bg-muted'}`}
                    >
                      <p className="font-semibold text-sm">{version.title}</p>
                      <p className="text-xs">{format(new Date(version.timestamp), 'MMM d, yyyy h:mm a')}</p>
                    </button>
                  ))
                ) : (
                  <p className="p-4 text-sm text-center text-muted-foreground">No saved versions yet.</p>
                )}
              </div>
            </ScrollArea>
          </div>
          <div className="col-span-2 flex flex-col">
            {selectedVersion ? (
                <>
                    <div className="p-4 border-b flex justify-between items-center">
                        <div>
                            <p className="font-semibold">{selectedVersion.title}</p>
                            <p className="text-sm text-muted-foreground">
                                Saved on {format(new Date(selectedVersion.timestamp), 'PPpp')}
                            </p>
                        </div>
                        <Button onClick={handleRestore} disabled={isRestoring}>
                            {isRestoring && <Loader2 className="mr-2 h-4 w-4 animate-spin"/>}
                            Restore this version
                        </Button>
                    </div>
                    <ScrollArea className="flex-1">
                        <div className="p-6 prose prose-sm max-w-none">
                            <DocumentRenderer content={selectedVersion.content?.content} />
                        </div>
                    </ScrollArea>
                </>
            ) : (
              <div className="flex items-center justify-center h-full text-muted-foreground">
                <p>Select a version to preview</p>
              </div>
            )}
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
