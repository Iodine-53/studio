
"use client";

import { useState, useEffect, type FC } from 'react';
import { X, Search } from 'lucide-react';
import { getAllDocuments, type Document } from '@/lib/db'; 
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';

type DocSearchModalProps = {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (doc: { id: number; title: string }) => void;
  currentDocId?: number; // To exclude the current doc from the list
};

export const DocSearchModal: FC<DocSearchModalProps> = ({ isOpen, onClose, onSelect, currentDocId }) => {
  const [allDocs, setAllDocs] = useState<Document[]>([]);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    if (isOpen) {
      const fetchDocs = async () => {
        const docs = await getAllDocuments();
        // Filter out the current document from the list
        setAllDocs(docs.filter(doc => doc.id !== currentDocId));
      };
      fetchDocs();
    }
  }, [isOpen, currentDocId]);

  const filteredDocs = allDocs.filter(doc =>
    doc.title.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleSelect = (doc: Document) => {
    if (doc.id) {
        onSelect({ id: doc.id, title: doc.title });
        onClose();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="sm:max-w-lg">
            <DialogHeader>
                <DialogTitle>Link to Document</DialogTitle>
            </DialogHeader>
            <div className="relative mt-4">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                    type="text"
                    placeholder="Search for a document to link..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    autoFocus
                    className="pl-10"
                />
            </div>
            <ScrollArea className="mt-4 h-80">
                <ul className="pr-4">
                    {filteredDocs.length > 0 ? (
                        filteredDocs.map(doc => (
                        <li key={doc.id}>
                            <button
                                onClick={() => handleSelect(doc)}
                                className="w-full text-left p-2 rounded-md text-card-foreground hover:bg-muted"
                            >
                            {doc.title}
                            </button>
                        </li>
                        ))
                    ) : (
                        <li className="p-4 text-center text-sm text-muted-foreground">No documents found.</li>
                    )}
                </ul>
            </ScrollArea>
        </DialogContent>
    </Dialog>
  );
};
