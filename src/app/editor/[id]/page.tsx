
"use client";

import { useEffect, useState, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import TiptapEditor from "@/components/tiptap-editor";
import { getDocument, saveDocument, type Document } from "@/lib/db";
import { ArrowLeft, Loader2, Eye, FileDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PrintPreview } from "@/components/PrintPreview";
import { exportToPdf } from "@/lib/utils";

export default function EditorPage() {
  const params = useParams();
  const router = useRouter();
  const [doc, setDoc] = useState<Document | null>(null);
  const [initialContent, setInitialContent] = useState<any>(null);
  const [currentContent, setCurrentContent] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isExporting, setIsExporting] = useState(false);
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

  const handleExport = async () => {
    if (!currentContent || !doc) return;
    setIsExporting(true);
    try {
        await exportToPdf(currentContent, doc.title || 'document');
    } catch (error) {
        console.error("Failed to export PDF:", error);
    } finally {
        setIsExporting(false);
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
               <Button variant="outline" onClick={handleExport} disabled={isExporting}>
                {isExporting ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <FileDown className="h-4 w-4 mr-2" />}
                Download PDF
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
