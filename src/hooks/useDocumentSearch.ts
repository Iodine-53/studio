
"use client";

import { useState, useMemo, useEffect } from 'react';
import Fuse from 'fuse.js';
import { type Document } from '@/lib/db';
import { tiptapJsonToText } from '@/lib/tiptap/tiptap-helpers';

// Define the shape of the data we'll be searching
type SearchableDocument = {
  id: number;
  title: string;
  textContent: string;
};

export const useDocumentSearch = (documents: Document[]) => {
  const [results, setResults] = useState<Document[]>(documents);

  // When the source documents array changes (e.g., after initial load),
  // update our results state to match.
  useEffect(() => {
    setResults(documents);
  }, [documents]);

  // useMemo is critical here for performance
  const fuse = useMemo(() => {
    // First, flatten the documents into a searchable format
    const searchableDocs: SearchableDocument[] = documents
      .filter(doc => doc.id !== undefined)
      .map(doc => ({
        id: doc.id!,
        title: doc.title || 'Untitled',
        textContent: doc.content ? tiptapJsonToText(doc.content) : '',
      }));
    
    const options: Fuse.IFuseOptions<SearchableDocument> = {
      keys: [
        { name: 'title', weight: 2 }, // Give title a higher weight
        { name: 'textContent', weight: 1 },
      ],
      includeScore: true,
      threshold: 0.4, // Adjust for more/less fuzzy matching
    };

    return new Fuse(searchableDocs, options);
  }, [documents]);

  const search = (query: string) => {
    if (!query.trim()) {
      setResults(documents); // If query is empty, show all docs
      return;
    }
    const searchResults = fuse.search(query);
    // Map Fuse results back to the original Document objects
    const matchedDocs = searchResults.map(result => 
      documents.find(doc => doc.id === result.item.id)
    ).filter(Boolean) as Document[]; // Filter out any potential undefineds

    setResults(matchedDocs);
  };

  return { results, search };
};
