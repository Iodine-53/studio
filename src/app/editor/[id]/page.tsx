
"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { useEditor, type Editor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Underline from '@tiptap/extension-underline';
import TextAlign from '@tiptap/extension-text-align';
import { CodeBlockLowlight } from '@tiptap/extension-code-block-lowlight';
import { lowlight } from 'lowlight';
import css from 'highlight.js/lib/languages/css';
import javascript from 'highlight.js/lib/languages/javascript';
import typescript from 'highlight.js/lib/languages/typescript';
import xml from 'highlight.js/lib/languages/xml';
import Table from '@tiptap/extension-table';
import TableCell from '@tiptap/extension-table-cell';
import TableHeader from '@tiptap/extension-table-header';
import TableRow from '@tiptap/extension-table-row';
import { Callout } from '@/lib/tiptap/extensions/Callout';
import { SlashCommand } from '@/components/editor/slash-command';
import { CustomImage } from '@/lib/tiptap/extensions/Image';
import TaskList from '@tiptap/extension-task-list';
import TaskItem from '@tiptap/extension-task-item';
import { Drawing } from '@/lib/tiptap/extensions/Drawing';
import { Chart } from '@/lib/tiptap/extensions/Chart';
import { TodoListExtension } from '@/lib/tiptap/extensions/TodoList';
import { Accordion } from '@/lib/tiptap/extensions/Accordion';
import { TrailingNode } from '@/lib/tiptap/extensions/TrailingNode';
import { LineHeight } from '@/lib/tiptap/extensions/LineHeight';
import { PasteHandler } from '@/lib/tiptap/extensions/PasteHandler';
import { Embed } from '@/lib/tiptap/extensions/Embed';
import TextStyle from '@tiptap/extension-text-style';
import { Color } from '@tiptap/extension-color';
import FontFamily from '@tiptap/extension-font-family';
import { FontSize } from '@/lib/tiptap/extensions/FontSize';

import TiptapEditor from "@/components/tiptap-editor";
import { getDocument, saveDocument, type Document } from "@/lib/db";
import { ArrowLeft, Loader2, Eye, Printer, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PrintPreview } from "@/components/PrintPreview";
import { saveAs } from 'file-saver';
import { exportToDocx } from '@/lib/docx-exporter';

// Register languages for code block highlighting
lowlight.registerLanguage('html', xml);
lowlight.registerLanguage('css', css);
lowlight.registerLanguage('js', javascript);
lowlight.registerLanguage('ts', typescript);


export default function EditorPage() {
  const params = useParams();
  const router = useRouter();
  const [doc, setDoc] = useState<Document | null>(null);
  const [currentContent, setCurrentContent] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isExportingDocx, setIsExportingDocx] = useState(false);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);

  const debounceTimeout = useRef<NodeJS.Timeout | null>(null);
  
  const idFromParams = Array.isArray(params.id) ? params.id[0] : params.id;
  const docId = Number(idFromParams);
  
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        codeBlock: false,
        image: false, // Disable default image to use our custom one
        link: {
            linkOnPaste: false,
            openOnClick: 'whenNotEditable',
        },
      }),
      Underline,
      TextAlign.configure({ types: ['heading', 'paragraph', 'listItem'] }),
      CodeBlockLowlight.configure({ lowlight }),
      Table.configure({ resizable: true }),
      TableRow, TableHeader, TableCell, Callout, SlashCommand, CustomImage, TaskList,
      TaskItem.configure({ nested: true }),
      Drawing, Chart, TodoListExtension, Accordion, Embed, PasteHandler, TrailingNode, LineHeight,
      TextStyle, Color, FontFamily, FontSize,
    ],
    editorProps: {
      attributes: {
        class: 'prose dark:prose-invert prose-sm sm:prose-base lg:prose-lg xl:prose-2xl p-6 focus:outline-none min-h-[350px] w-full',
      },
    },
    onUpdate: ({ editor }) => {
      const json = editor.getJSON();
      setCurrentContent(json); // Update content for print preview
      if (doc) {
        if (debounceTimeout.current) {
          clearTimeout(debounceTimeout.current);
        }
        debounceTimeout.current = setTimeout(() => {
          saveDocument({ ...doc, content: json });
          console.log("Document auto-saved!");
        }, 1000);
      }
    },
  });

  useEffect(() => {
    if (isNaN(docId)) {
      router.push("/");
      return;
    }

    const fetchDocument = async () => {
      setIsLoading(true);
      const loadedDoc = await getDocument(docId);
      if (loadedDoc) {
        setDoc(loadedDoc);
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
    
    return () => {
      if (debounceTimeout.current) {
        clearTimeout(debounceTimeout.current);
      }
    };
  }, [docId, router]);
  
  // Effect to sync loaded document content to the editor instance
  useEffect(() => {
    if (editor && doc && !editor.isDestroyed) {
      const editorContent = editor.getJSON();
      const docContent = doc.content;
      // Only set content if it's different to prevent loops and cursor jumps
      if (JSON.stringify(editorContent) !== JSON.stringify(docContent)) {
        editor.commands.setContent(docContent, false);
      }
    }
  }, [editor, doc]);

  const handleOpenPreview = () => {
    setIsPreviewOpen(true);
  };

  const handlePrint = () => {
    if (!currentContent) {
        alert("Cannot print an empty document.");
        return;
    }
    localStorage.setItem('documentToPrint', JSON.stringify(currentContent));
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

  if (isLoading || !editor) {
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
            <TiptapEditor editor={editor} />
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
