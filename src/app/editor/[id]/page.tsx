
"use client";

import { useEffect, useState, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import TiptapEditor from "@/components/tiptap-editor";
import { getDocument, saveDocument, type Document } from "@/lib/db";
import { ArrowLeft, Loader2, Eye, Printer, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PrintPreview } from "@/components/PrintPreview";
import { saveAs } from 'file-saver';
import { exportToDocx } from '@/lib/docx-exporter';

export default function EditorPage() {
  const params = useParams();
  const router = useRouter();
  const [doc, setDoc] = useState<Document | null>(null);
  const [initialContent, setInitialContent] = useState<any>(null);
  const [currentContent, setCurrentContent] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isExportingDocx, setIsExportingDocx] = useState(false);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);

  // Ref to hold the timeout ID for debouncing
  const debounceTimeout = useRef<NodeJS.Timeout | null>(null);

  const idFromParams = Array.isArray(params.id) ? params.id[0] : params.id;
  const docId = Number(idFromParams);

  useEffect(() => {
    if (isNaN(docId)) {
      router.push("/"); // Redirect if ID is not a number
      return;
    }

    const fetchDocument = async () => {
      setIsLoading(true);
      const loadedDoc = await getDocument(docId);
      if (loadedDoc) {
        setDoc(loadedDoc);
        setInitialContent(loadedDoc.content);
        setCurrentContent(loadedDoc.content);
      } else {
        console.error("Document not found");
        router.push("/");
      }
      setIsLoading(false);
    };
    
    if (docId) {
        fetchDocument();
    }
    
    // Cleanup the debounce timer when the component unmounts
    return () => {
      if (debounceTimeout.current) {
        clearTimeout(debounceTimeout.current);
      }
    };
  }, [docId, router]);

  const handleUpdate = (content: any) => {
    setCurrentContent(content);
    if (doc) {
      if (debounceTimeout.current) {
        clearTimeout(debounceTimeout.current);
      }

      debounceTimeout.current = setTimeout(() => {
        saveDocument({ ...doc, content: content });
        console.log("Document auto-saved!");
      }, 1000); // 1-second debounce delay
    }
  };

  const handleOpenPreview = () => {
    setIsPreviewOpen(true);
  };

  const handlePrint = () => {
    if (!currentContent) {
        alert("Cannot print an empty document.");
        return;
    }

    // 1. Get the document's JSON (which is our currentContent)
    const documentJson = currentContent;

    // 2. Save it to localStorage under a specific key
    localStorage.setItem('documentToPrint', JSON.stringify(documentJson));

    // 3. Open the dedicated print page in a new tab
    const printWindow = window.open('/print', '_blank');
    if (!printWindow) {
        alert("Please allow popups to print the document.");
    }
  };

  const handleDocxExport = async () => {
    if (!currentContent) {
        alert("Cannot export an empty document.");
        return;
    }
    setIsExportingDocx(true);
    try {
        const blob = await exportToDocx(currentContent);
        saveAs(blob, `${doc?.title || 'Document'}.docx`);
    } catch (error) {
        console.error("Failed to export DOCX", error);
        alert("An error occurred while exporting to DOCX. Please check the console for details.");
    } finally {
        setIsExportingDocx(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="ml-4 text-lg text-muted-foreground">Loading Document...</span>
      </div>
    );
  }

  return (
    <>
      <div className="flex flex-col min-h-screen bg-primary/5">
        <header className="sticky top-0 z-10 flex items-center h-16 px-4 border-b bg-background md:px-6">
          <nav className="flex items-center w-full justify-between gap-4 text-lg font-medium md:gap-2 md:text-sm">
            <div className="flex items-center gap-4">
                <Button variant="outline" size="icon" className="shrink-0" asChild>
                    <Link href="/">
                    <ArrowLeft className="h-4 w-4" />
                    <span className="sr-only">Back to Dashboard</span>
                    </Link>
                </Button>
                <div className="flex-1">
                    {doc && <h1 className="text-xl font-bold font-headline text-primary truncate">{doc.title}</h1>}
                </div>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" onClick={handleOpenPreview}>
                <Eye className="h-4 w-4 mr-2" />
                Preview
              </Button>
               <Button variant="outline" onClick={handlePrint}>
                <Printer className="h-4 w-4 mr-2" />
                Print
              </Button>
              <Button variant="outline" onClick={handleDocxExport} disabled={isExportingDocx}>
                {isExportingDocx ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <FileText className="h-4 w-4 mr-2" />}
                {isExportingDocx ? 'Exporting...' : 'Export DOCX'}
              </Button>
            </div>
          </nav>
        </header>
        <main className="flex-1 flex flex-col items-center justify-start p-4 sm:p-6 md:p-8">
          <div className="w-full max-w-4xl bg-card rounded-xl shadow-lg overflow-hidden border">
            <TiptapEditor content={initialContent} onUpdate={handleUpdate} />
          </div>
        </main>
      </div>
      <PrintPreview
        isOpen={isPreviewOpen}
        onClose={() => setIsPreviewOpen(false)}
        content={currentContent}
      />
    </>
  );
}
