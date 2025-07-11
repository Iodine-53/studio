
"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { useEditor, type Editor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Underline from '@tiptap/extension-underline';
import TextAlign from '@tiptap/extension-text-align';
import { SlashCommand } from '@/lib/tiptap/extensions/slash-command';
import { TrailingNode } from '@/lib/tiptap/extensions/TrailingNode';
import { LineHeight } from '@/lib/tiptap/extensions/LineHeight';
import TextStyle from '@tiptap/extension-text-style';
import { Color } from '@tiptap/extension-color';
import FontFamily from '@tiptap/extension-font-family';
import { FontSize } from '@/lib/tiptap/extensions/FontSize';
import { CustomImage } from '@/lib/tiptap/extensions/Image';
import { InteractiveTable } from '@/lib/tiptap/extensions/InteractiveTable';
import { lowlight } from 'lowlight/lib/core';
import CodeBlockLowlight from '@tiptap/extension-code-block-lowlight';
import css from 'highlight.js/lib/languages/css';
import js from 'highlight.js/lib/languages/javascript';
import ts from 'highlight.js/lib/languages/typescript';
import html from 'highlight.js/lib/languages/xml'; // for HTML
import HorizontalRule from '@tiptap/extension-horizontal-rule';
import { Chart } from '@/lib/tiptap/extensions/Chart';
import { Drawing } from '@/lib/tiptap/extensions/Drawing';
import { TodoListExtension } from '@/lib/tiptap/extensions/TodoList';
import { Embed } from '@/lib/tiptap/extensions/Embed';
import { Callout } from '@/lib/tiptap/extensions/Callout';
import { PasteHandler } from '@/lib/tiptap/extensions/PasteHandler';
import { ProgressBarBlock } from "@/lib/tiptap/extensions/ProgressBar";
import { FunctionPlot } from '@/lib/tiptap/extensions/FunctionPlot';
import { Calculator } from '@/lib/tiptap/extensions/Calculator';
import { ToggleExtension } from '@/lib/tiptap/extensions/Toggle';
import { TaskList } from '@tiptap/extension-task-list';
import { TaskItem } from '@tiptap/extension-task-item';
import { ColumnsExtension } from "@/lib/tiptap/extensions/Columns";
import { ColumnExtension } from "@/lib/tiptap/extensions/Column";


import TiptapEditor from "@/components/tiptap-editor";
import { getDocument, saveDocument, type Document } from "@/lib/db";
import { ArrowLeft, Loader2, Eye, FileText, Download, Braces, FileCode2, FileMarkdown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { PrintPreview } from "@/components/PrintPreview";
import { saveAs } from 'file-saver';
import { exportToDocx } from '@/lib/docx-exporter';
import TurndownService from 'turndown';
import { AiAssistantDialog } from "@/components/AiAssistantDialog";
import { ToggleTemplateModal } from "@/components/modals/ToggleTemplateModal";

// Register languages for code block syntax highlighting
lowlight.registerLanguage('html', html);
lowlight.registerLanguage('css', css);
lowlight.registerLanguage('js', js);
lowlight.registerLanguage('ts', ts);


export default function EditorPage() {
  const params = useParams();
  const router = useRouter();
  const [doc, setDoc] = useState<Document | null>(null);
  const [currentContent, setCurrentContent] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isExportingDocx, setIsExportingDocx] = useState(false);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [isAiAssistantOpen, setIsAiAssistantOpen] = useState(false);
  const [isToggleModalOpen, setIsToggleModalOpen] = useState(false);

  const debounceTimeout = useRef<NodeJS.Timeout | null>(null);
  
  const idFromParams = Array.isArray(params.id) ? params.id[0] : params.id;
  const docId = Number(idFromParams);
  
  const handleSelectToggle = (templateId: string) => {
    editor?.chain().focus().setToggle({ type: templateId }).run();
    setIsToggleModalOpen(false);
  };
  
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        // Disable Tiptap's default complex blocks to use our own custom versions
        codeBlock: false,
        horizontalRule: false,
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
          'todoList',
          'embed',
          'interactiveTable',
          'progressBarBlock',
        ] 
      }),
      SlashCommand.configure({
        openToggleModal: () => setIsToggleModalOpen(true),
      }),
      TrailingNode,
      LineHeight,
      TextStyle, 
      Color, 
      FontFamily, 
      FontSize,
      CustomImage,
      InteractiveTable,
      CodeBlockLowlight.configure({ lowlight }),
      HorizontalRule,
      Chart,
      Drawing,
      TodoListExtension,
      Embed,
      Callout,
      PasteHandler,
      ProgressBarBlock,
      FunctionPlot,
      Calculator,
      ToggleExtension,
      TaskList,
      TaskItem.configure({
        nested: true,
      }),
      ColumnsExtension,
      ColumnExtension,
    ],
    editorProps: {
      attributes: {
        class: 'prose dark:prose-invert max-w-none prose-sm sm:prose-base lg:prose-lg xl:prose-2xl p-6 focus:outline-none w-full flex-grow',
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
  
  const handleJsonExport = () => {
      if (!editor) return;
      const json = editor.getJSON();
      const jsonString = JSON.stringify(json, null, 2);
      const blob = new Blob([jsonString], { type: 'application/json' });
      saveAs(blob, `${doc?.title || 'Document'}.json`);
  };

  const handleHtmlExport = () => {
      if (!editor) return;
      const html = editor.getHTML();
      const blob = new Blob([html], { type: 'text/html;charset=utf-8' });
      saveAs(blob, `${doc?.title || 'Document'}.html`);
  };

  const handleMarkdownExport = () => {
      if (!editor) return;
      const html = editor.getHTML();
      const turndownService = new TurndownService();
      const markdown = turndownService.turndown(html);
      const blob = new Blob([markdown], { type: 'text/markdown;charset=utf-8' });
      saveAs(blob, `${doc?.title || 'Document'}.md`);
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
        <header className="sticky top-0 z-30 flex items-center h-16 px-4 border-b bg-background md:px-6">
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
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="sm" disabled={isExportingDocx} className="relative w-[135px]">
                        {isExportingDocx ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                            <>
                                <Download className="h-4 w-4 md:mr-2" />
                                <span className="hidden md:inline">Export</span>
                            </>
                        )}
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={handleDocxExport}>
                        <FileText className="mr-2 h-4 w-4" />
                        Export as DOCX
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={handleJsonExport}>
                        <Braces className="mr-2 h-4 w-4" />
                        Export as JSON
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={handleHtmlExport}>
                        <FileCode2 className="mr-2 h-4 w-4" />
                        Export as HTML
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={handleMarkdownExport}>
                        <FileMarkdown className="mr-2 h-4 w-4" />
                        Export as Markdown
                    </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </nav>
        </header>
        <main className="flex-1 flex flex-col items-center justify-start p-4 sm:p-6 md:p-8 overflow-hidden">
            <div className="w-full max-w-6xl glassmorphism rounded-2xl shadow-2xl overflow-hidden border flex flex-col flex-grow">
                <TiptapEditor 
                  editor={editor} 
                  onAiAssistantClick={() => setIsAiAssistantOpen(true)}
                  onAddToggleClick={() => setIsToggleModalOpen(true)}
                />
            </div>
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
      <ToggleTemplateModal
        isOpen={isToggleModalOpen}
        onClose={() => setIsToggleModalOpen(false)}
        onSelect={handleSelectToggle}
      />
    </>
  );
}
