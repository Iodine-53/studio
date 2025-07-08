
"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { useEditor, type Editor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Underline from '@tiptap/extension-underline';
import TextAlign from '@tiptap/extension-text-align';
import { SlashCommand } from '@/components/editor/slash-command';
import { TrailingNode } from '@/lib/tiptap/extensions/TrailingNode';
import { LineHeight } from '@/lib/tiptap/extensions/LineHeight';
import TextStyle from '@tiptap/extension-text-style';
import { Color } from '@tiptap/extension-color';
import FontFamily from '@tiptap/extension-font-family';
import { FontSize } from '@/lib/tiptap/extensions/FontSize';
import { CustomImage } from '@/lib/tiptap/extensions/Image';
import { InteractiveTable } from '@/lib/tiptap/extensions/InteractiveTable';
import TaskList from '@tiptap/extension-task-list';
import TaskItem from '@tiptap/extension-task-item';
import { lowlight } from 'lowlight/lib/core';
import CodeBlockLowlight from '@tiptap/extension-code-block-lowlight';
import css from 'highlight.js/lib/languages/css';
import js from 'highlight.js/lib/languages/javascript';
import ts from 'highlight.js/lib/languages/typescript';
import html from 'highlight.js/lib/languages/xml'; // for HTML
import HorizontalRule from '@tiptap/extension-horizontal-rule';
import { Chart } from '@/lib/tiptap/extensions/Chart';
import { Drawing } from '@/lib/tiptap/extensions/Drawing';
import { Accordion } from '@/lib/tiptap/extensions/Accordion';
import { TodoListExtension } from '@/lib/tiptap/extensions/TodoList';
import { Embed } from '@/lib/tiptap/extensions/Embed';
import { Callout } from '@/lib/tiptap/extensions/Callout';
import { PasteHandler } from '@/lib/tiptap/extensions/PasteHandler';
import { ProgressBarBlock } from "@/lib/tiptap/extensions/ProgressBar";

import TiptapEditor from "@/components/tiptap-editor";
import { getDocument, saveDocument, getAllDocuments, type Document } from "@/lib/db";
import { ArrowLeft, Loader2, Eye, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PrintPreview } from "@/components/PrintPreview";
import { saveAs } from 'file-saver';
import { exportToDocx } from '@/lib/docx-exporter';
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { format } from 'date-fns';
import { AiAssistantDialog } from "@/components/AiAssistantDialog";

// Register languages for code block syntax highlighting
lowlight.registerLanguage('html', html);
lowlight.registerLanguage('css', css);
lowlight.registerLanguage('js', js);
lowlight.registerLanguage('ts', ts);


export default function EditorPage() {
  const params = useParams();
  const router = useRouter();
  const [doc, setDoc] = useState<Document | null>(null);
  const [recentDocuments, setRecentDocuments] = useState<Document[]>([]);
  const [currentContent, setCurrentContent] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isExportingDocx, setIsExportingDocx] = useState(false);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [isAiAssistantOpen, setIsAiAssistantOpen] = useState(false);

  const debounceTimeout = useRef<NodeJS.Timeout | null>(null);
  
  const idFromParams = Array.isArray(params.id) ? params.id[0] : params.id;
  const docId = Number(idFromParams);
  
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        // Disable Tiptap's default complex blocks to use our own custom versions
        codeBlock: false,
        horizontalRule: false,
        bulletList: false,
        orderedList: false,
        listItem: false,
        taskItem: false,
        taskList: false,
        image: false,
        table: false,
        tableRow: false,
        tableHeader: false,
        tableCell: false,
        // from original config
        link: {
            linkOnPaste: false,
            openOnClick: 'whenNotEditable',
        },
      }),
      Underline,
      TextAlign.configure({ 
        types: [
          'heading', 
          'paragraph',
          'image',
          'chartBlock',
          'drawing',
          'accordion',
          'todoList',
          'embed',
          'interactiveTable',
          'progressBarBlock'
        ] 
      }),
      SlashCommand,
      TrailingNode,
      LineHeight,
      TextStyle, 
      Color, 
      FontFamily, 
      FontSize,
      CustomImage,
      InteractiveTable,
      TaskList,
      TaskItem.configure({ nested: true }),
      CodeBlockLowlight.configure({ lowlight }),
      HorizontalRule,
      Chart,
      Drawing,
      Accordion,
      TodoListExtension,
      Embed,
      Callout,
      PasteHandler,
      ProgressBarBlock,
    ],
    editorProps: {
      attributes: {
        class: 'prose dark:prose-invert prose-sm sm:prose-base lg:prose-lg xl:prose-2xl p-6 focus:outline-none w-full',
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

    const fetchDocuments = async () => {
      setIsLoading(true);
      const [loadedDoc, allDocs] = await Promise.all([
        getDocument(docId),
        getAllDocuments()
      ]);

      if (loadedDoc) {
        setDoc(loadedDoc);
        setCurrentContent(loadedDoc.content);
      } else {
        console.error("Document not found");
        router.push("/");
      }

      const filteredDocs = allDocs
        .filter(d => d.id !== docId)
        .slice(0, 5);
      setRecentDocuments(filteredDocs);
      
      setIsLoading(false);
    };
    
    if (docId) {
        fetchDocuments();
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
                    <Link href="/documents">
                    <ArrowLeft className="h-4 w-4" />
                    <span className="sr-only">Back to Document Hub</span>
                    </Link>
                </Button>
                <div className="flex-1">
                    {doc && <h1 className="text-xl font-bold font-headline text-primary truncate max-w-xs sm:max-w-sm md:max-w-md">{doc.title}</h1>}
                </div>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={handleOpenPreview} className="relative">
                <Eye className="h-4 w-4 md:mr-2" />
                <span className="hidden md:inline">Preview</span>
              </Button>
              <Button variant="outline" size="sm" onClick={handleDocxExport} disabled={isExportingDocx} className="relative">
                {isExportingDocx ? <Loader2 className="h-4 w-4 animate-spin" /> : <FileText className="h-4 w-4 md:mr-2" />}
                <span className="hidden md:inline">{isExportingDocx ? 'Exporting...' : 'Export DOCX'}</span>
              </Button>
            </div>
          </nav>
        </header>
        <main className="flex-1 flex w-full justify-center gap-8 px-4 py-8">
            {/* Editor Column */}
            <div className="flex-shrink-0 w-full max-w-[210mm]">
                <div className="bg-card rounded-lg shadow-2xl border min-h-[85vh]">
                    <TiptapEditor editor={editor} onAiAssistantClick={() => setIsAiAssistantOpen(true)} />
                </div>
            </div>

            {/* Recent Documents Sidebar (Right Column) */}
            <aside className="hidden xl:block w-72 flex-shrink-0">
                <div className="sticky top-24 space-y-6">
                    <h2 className="text-xl font-bold font-headline text-primary">Recent Documents</h2>
                    {recentDocuments.length > 0 ? (
                        <div className="space-y-4">
                            {recentDocuments.map((recentDoc) => (
                                <Link href={`/editor/${recentDoc.id}`} key={recentDoc.id} className="block">
                                    <Card className="transition-all duration-300 hover:border-primary hover:shadow-lg hover:-translate-y-0.5">
                                        <CardHeader>
                                            <CardTitle className="text-lg truncate">{recentDoc.title}</CardTitle>
                                            <CardDescription>
                                                Updated: {format(new Date(recentDoc.updatedAt), 'PP')}
                                            </CardDescription>
                                        </CardHeader>
                                    </Card>
                                </Link>
                            ))}
                        </div>
                    ) : (
                        <p className="text-sm text-muted-foreground italic">No other documents found.</p>
                    )}
                </div>
            </aside>
        </main>
      </div>
      <PrintPreview
        isOpen={isPreviewOpen}
        onClose={() => setIsPreviewOpen(false)}
        content={currentContent}
      />
      <AiAssistantDialog 
        open={isAiAssistantOpen} 
        onOpenChange={setIsAiAssistantOpen} 
        editor={editor}
      />
    </>
  );
}
