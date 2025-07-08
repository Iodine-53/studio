
"use client";

import { useEffect, useState } from "react";
import { TiptapNode, DocumentRenderer } from "@/components/PrintPreview";
import { Button } from "@/components/ui/button";
import { Loader2, Printer } from "lucide-react";

export default function PrintPage() {
  const [docContent, setDocContent] = useState<TiptapNode | null>(null);

  useEffect(() => {
    // This code runs only on the client side
    const jsonString = localStorage.getItem('documentToPrint');
    if (jsonString) {
      try {
        const parsedDocument = JSON.parse(jsonString);
        setDocContent(parsedDocument);
        // Clean up localStorage for privacy
        localStorage.removeItem('documentToPrint');
      } catch (error) {
        console.error("Failed to parse document from localStorage", error);
      }
    }
  }, []); // The empty dependency array ensures this runs only once on mount

  // New effect to scale down wide tables to fit the page
  useEffect(() => {
    if (!docContent) return;

    // This needs to run after the content has been rendered to the DOM
    const timeoutId = setTimeout(() => {
        const tableContainers = document.querySelectorAll('.printable-table-container');

        tableContainers.forEach(container => {
            const el = container as HTMLElement;
            const table = el.querySelector('table');
            // If the table's actual width is greater than the container's width, scale it down.
            if (table && el.clientWidth > 0 && table.offsetWidth > el.clientWidth) {
                const scale = el.clientWidth / table.offsetWidth;
                // Apply scale and set origin to top-left to keep it aligned correctly.
                el.style.transform = `scale(${scale})`;
                el.style.transformOrigin = 'top left';
            }
        });
    }, 100); // Small delay to ensure DOM is ready for measurement

    return () => clearTimeout(timeoutId);

  }, [docContent]);


  if (!docContent) {
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
              /* Hide UI elements */
              .no-print {
                display: none !important;
              }
              
              /* Reset and base styles */
              * {
                -webkit-print-color-adjust: exact !important;
                color-adjust: exact !important;
                print-color-adjust: exact !important;
              }
              
              body {
                background: white !important;
                color: black !important;
                font-size: 12pt;
                line-height: 1.4;
                margin: 0;
                padding: 0;
              }
              
              main {
                background-color: transparent !important;
                padding: 0;
                margin: 0;
              }
              
              #printable-area {
                box-shadow: none !important;
                border: none !important;
                padding: 0 !important; /* The @page margin will handle spacing */
                margin: 0 !important;
                width: 100% !important;
                min-height: auto !important;
              }
              
              @page {
                size: A4;
                margin: 1in;
              }
              
              /* TIPTAP NODE EXTENSIONS */
              
              /* Chart, Drawing, Image, Custom Nodes - Avoid breaking them */
              [data-type="chartBlock"],
              [data-type="drawing"],
              [data-type="image"],
              .ProseMirror-selectednode,
              img {
                page-break-inside: avoid !important;
              }

              img {
                max-width: 100% !important;
                height: auto !important;
              }
              
              /* Code Block Nodes */
              pre {
                page-break-inside: avoid !important;
                white-space: pre-wrap !important;
                word-wrap: break-word !important;
                font-size: 10pt !important;
                background: #f5f5f5 !important;
                border: 1px solid #ddd !important;
                padding: 15px !important;
                margin: 15px 0 !important;
                overflow: visible !important;
              }
              
              /* Table Nodes */
              table {
                page-break-inside: auto !important;
                border-collapse: collapse !important;
                /* Let table take its natural width, don't force 100% */
                width: auto;
                margin: 15px 0 !important;
              }
              
              thead {
                display: table-header-group !important;
              }
              
              tr {
                page-break-inside: avoid !important;
              }
              
              th, td {
                padding: 8px !important;
                border: 1px solid #333 !important;
                font-size: 11pt !important;
              }
              
              th {
                background: #f0f0f0 !important;
                font-weight: bold !important;
              }
              
              /* Typography */
              h1, h2, h3, h4, h5, h6 {
                page-break-after: avoid !important;
              }
              
              p {
                orphans: 3;
                widows: 3;
              }

              ul, ol {
                orphans: 3;
                widows: 3;
                padding-left: 1.5rem;
                list-style-position: outside;
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
          {docContent.content && <DocumentRenderer content={docContent.content} />}
        </div>
      </div>
    </main>
  );
}
