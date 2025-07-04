
"use client";

import { useEffect, useState } from "react";
import { TiptapNode, DocumentRenderer } from "@/components/PrintPreview";
import { Button } from "@/components/ui/button";
import { Loader2, Printer } from "lucide-react";

export default function PrintPage() {
  const [document, setDocument] = useState<TiptapNode | null>(null);

  useEffect(() => {
    // This code runs only on the client side
    const jsonString = localStorage.getItem('documentToPrint');
    if (jsonString) {
      try {
        const parsedDocument = JSON.parse(jsonString);
        setDocument(parsedDocument);
        // Clean up localStorage for privacy
        localStorage.removeItem('documentToPrint');
      } catch (error) {
        console.error("Failed to parse document from localStorage", error);
      }
    }
  }, []); // The empty dependency array ensures this runs only once on mount

  if (!document) {
    return (
        <div className="flex h-screen w-full items-center justify-center bg-background">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <span className="ml-4 text-lg text-muted-foreground">Loading document...</span>
        </div>
    );
  }

  return (
    <main className="bg-muted min-h-screen py-12">
        {/* Print-specific styles */}
        <style>{`
            @media print {
              .no-print {
                display: none !important;
              }
              body {
                background-color: #fff !important;
              }
              main {
                background-color: transparent !important;
                padding: 0;
                margin: 0;
              }
              #printable-area {
                box-shadow: none !important;
                margin: 0 !important;
                padding: 1in !important;
                min-height: auto;
              }
              @page {
                size: A4;
                margin: 0;
              }
            }
        `}</style>

      {/* Floating Print Button */}
      <Button
        onClick={() => window.print()}
        className="fixed top-4 right-4 z-50 no-print"
      >
        <Printer className="mr-2 h-4 w-4" />
        Print or Save as PDF
      </Button>

      {/* A4 Page Simulation */}
      <div id="printable-area" className="mx-auto w-[210mm] min-h-[297mm] bg-white p-[1in] shadow-2xl">
        <div className="prose prose-sm sm:prose-base max-w-none">
          {document.content && <DocumentRenderer content={document.content} />}
        </div>
      </div>
    </main>
  );
}
