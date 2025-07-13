

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
import TaskList from '@tiptap/extension-task-list';
import TaskItem from '@tiptap/extension-task-item';
import { Embed } from '@/lib/tiptap/extensions/Embed';
import { Callout } from '@/lib/tiptap/extensions/Callout';
import { PasteHandler } from '@/lib/tiptap/extensions/PasteHandler';
import { ProgressBarBlock } from "@/lib/tiptap/extensions/ProgressBar";
import { FunctionPlot } from '@/lib/tiptap/extensions/FunctionPlot';
import { Calculator } from '@/lib/tiptap/extensions/Calculator';
import { ToggleExtension } from '@/lib/tiptap/extensions/Toggle';
import { ColumnsExtension } from "@/lib/tiptap/extensions/Columns";
import { ColumnExtension } from "@/lib/tiptap/extensions/Column";
import { MindMap } from "@/lib/tiptap/extensions/MindMap";
import { InlineMath, MathBlock } from '@/lib/tiptap/extensions/Math';
import { DocLinkExtension } from '@/lib/tiptap/extensions/DocLink';
import { Link as TiptapLink } from '@tiptap/extension-link';
import 'katex/dist/katex.min.css';


import TiptapEditor from "@/components/tiptap-editor";
import { EditorSidebar } from "@/components/EditorSidebar";
import { getDocument, saveDocument, type Document, addDocVersion, type DocumentVersion } from "@/lib/db";
import { ArrowLeft, Loader2, Eye, FileText, Download, Braces, FileCode2, BookOpen, History, PanelRight, MoreVertical } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { PrintPreview } from "@/components/PrintPreview";
import { saveAs } from 'file-saver';
import { exportToDocx } from '@/lib/docx-exporter';
import { exportToHtml } from '@/lib/html-exporter';
import TurndownService from 'turndown';
import { AiAssistantDialog } from "@/components/AiAssistantDialog";
import { ToggleTemplateModal } from "@/components/modals/ToggleTemplateModal";
import { EquationModal } from "@/components/EquationModal";
import { DocSearchModal } from '@/components/DocSearchModal';
import { useToast } from "@/hooks/use-toast";
import { VersionHistory } from "@/components/VersionHistory";
import { tiptapJsonToText } from '@/lib/tiptap/tiptap-helpers';
import { cn } from "@/lib/utils";
import { useMediaQuery } from '@/hooks/use-media-query';

lowlight.registerLanguage('html', html);
lowlight.registerLanguage('css', css);
lowlight.registerLanguage('js', js);
lowlight.registerLanguage('ts', ts);

const SAVE_DEBOUNCE_MS = 1000;
const VERSION_INTERVAL_MS = 5 * 60 * 1000; // 5 minutes
const VERSION_CHAR_THRESHOLD = 100;

export default function EditorPage() {
  const params = useParams();
  const router = useRouter();
  const [doc, setDoc] = useState<Document | null>(null);
  const [currentContent, setCurrentContent] = useState<any>(null);
  const [tags, setTags] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isExporting, setIsExporting] = useState(false);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [isAiAssistantOpen, setIsAiAssistantOpen] = useState(false);
  const [isToggleModalOpen, setIsToggleModalOpen] = useState(false);
  const [isEquationModalOpen, setIsEquationModalOpen] = useState(false);
  const [isDocSearchOpen, setIsDocSearchOpen] = useState(false);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  
  const isMobile = useMediaQuery('(max-width: 768px)');

  const { toast } = useToast();

  const debounceTimeout = useRef<NodeJS.Timeout | null>(null);
  const lastVersionTime = useRef<number>(Date.now());
  const lastVersionContent = useRef<string>('');
  
  const idFromParams = Array.isArray(params.id) ? params.id[0] : params.id;
  const docId = Number(idFromParams);
  
  const handleSelectToggle = (templateId: string) => {
    editor?.chain().focus().setToggle({ type: templateId }).run();
    setIsToggleModalOpen(false);
  };
  
  const handleInsertEquation = (latex: string) => {
    editor?.chain().focus().insertMathBlock({ content: latex }).run();
  };

  const handleSelectDocLink = (linkedDoc: { id: number; title: string }) => {
    if (editor) {
      editor.chain().focus().setDocLink({
        docId: String(linkedDoc.id),
        label: linkedDoc.title,
      }).run();
    }
  };

  const handleTagsChange = useCallback((newTags: string[]) => {
      setTags(newTags);
      if (doc?.id) {
          saveDocument({ id: doc.id, tags: newTags });
      }
  }, [doc?.id]);

  const handleMetadataUpdate = useCallback((newMetadata: Record<string, string>) => {
    if (doc?.id) {
      saveDocument({ id: doc.id, metadata: newMetadata });
    }
  }, [doc?.id]);


  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        codeBlock: false, horizontalRule: false, image: false, table: false, tableRow: false, tableHeader: false, tableCell: false, link: false,
        heading: { levels: [1, 2, 3] }, // Limit headings
      }),
      Underline,
      TextAlign.configure({ types: ['heading', 'paragraph', 'image', 'chartBlock', 'drawing', 'todoList', 'callout', 'interactiveTable', 'embed', 'progressBarBlock', 'functionPlot', 'mindMap'] }),
      SlashCommand.configure({ openToggleModal: () => setIsToggleModalOpen(true), openDocSearchModal: () => setIsDocSearchOpen(true) }),
      TrailingNode, LineHeight, TextStyle, Color, FontFamily, FontSize, CustomImage, InteractiveTable,
      CodeBlockLowlight.configure({ lowlight }),
      HorizontalRule, Chart, Drawing, Embed, Callout, PasteHandler, ProgressBarBlock, FunctionPlot, Calculator, ToggleExtension,
      ColumnsExtension, ColumnExtension, MindMap, InlineMath, MathBlock, DocLinkExtension,
      TiptapLink.configure({ linkOnPaste: false, openOnClick: 'whenNotEditable' }),
      TaskList,
      TaskItem,
    ],
    editorProps: {
      attributes: {
        class: cn('prose dark:prose-invert max-w-none prose-sm sm:prose-base lg:prose-lg xl:prose-2xl p-6 focus:outline-none w-full flex-grow'),
      },
    },
    onUpdate: ({ editor }) => {
        const json = editor.getJSON();
        setCurrentContent(json);
        if (!doc) return;

        if (debounceTimeout.current) clearTimeout(debounceTimeout.current);
        
        debounceTimeout.current = setTimeout(async () => {
            await saveDocument({ ...doc, content: json });
            console.log("Document auto-saved!");
            
            const currentText = tiptapJsonToText(json);
            const now = Date.now();
            const timeDiff = now - lastVersionTime.current;
            const charDiff = Math.abs(currentText.length - (lastVersionContent.current?.length || 0));
            
            if (timeDiff > VERSION_INTERVAL_MS || charDiff > VERSION_CHAR_THRESHOLD) {
                await addDocVersion({ docId: doc.id!, content: json, title: doc.title });
                console.log(`New version created for doc ${doc.id}`);
                lastVersionTime.current = now;
                lastVersionContent.current = currentText;
            }
        }, SAVE_DEBOUNCE_MS);
    },
  });

  useEffect(() => {
    if (isNaN(docId)) {
      router.push("/");
      return;
    }

    const fetchDocument = async () => {
      try {
        setIsLoading(true);
        const loadedDoc = await getDocument(docId);
        if (loadedDoc) {
          setDoc(loadedDoc);
          setCurrentContent(loadedDoc.content);
          setTags(loadedDoc.tags || []);
          lastVersionContent.current = tiptapJsonToText(loadedDoc.content);
          lastVersionTime.current = new Date(loadedDoc.updatedAt).getTime();
        } else {
          console.error("Document not found");
          router.push("/documents");
        }
      } catch (error) {
        console.error("Failed to load document:", error);
        router.push("/documents");
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchDocument();
    
    return () => {
      if (debounceTimeout.current) clearTimeout(debounceTimeout.current);
    };
  }, [docId, router]);
  
  useEffect(() => {
    if (editor && doc && !editor.isDestroyed) {
      const editorContent = editor.getJSON();
      const docContent = doc.content;
      if (JSON.stringify(editorContent) !== JSON.stringify(docContent)) {
        editor.commands.setContent(docContent, false);
      }
    }
  }, [editor, doc]);

  const handleOpenPreview = () => setIsPreviewOpen(true);
  
  const handleDocxExport = async () => {
    if (!currentContent) return;
    setIsExporting(true);
    try {
        const blob = await exportToDocx(currentContent);
        saveAs(blob, `${doc?.title || 'Document'}.docx`);
    } catch (error) {
        console.error("Failed to export DOCX", error);
    } finally {
        setIsExporting(false);
    }
  };
  
  const handleJsonExport = () => {
      if (!editor) return;
      const json = editor.getJSON();
      const jsonString = JSON.stringify(json, null, 2);
      const blob = new Blob([jsonString], { type: 'application/json' });
      saveAs(blob, `${doc?.title || 'Document'}.json`);
  };

  const handleHtmlExport = async () => {
      if (!editor) return;
      setIsExporting(true);
      try {
        const htmlBlob = await exportToHtml(editor);
        saveAs(htmlBlob, `${doc?.title || 'Document'}.html`);
      } catch (error) {
        console.error("Failed to export HTML", error);
      } finally {
        setIsExporting(false);
      }
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
  
  const headerContent = isMobile ? (
    <div className="flex items-center justify-between flex-1">
        <Button variant="outline" size="icon" className="shrink-0" asChild>
            <Link href="/documents">
                <ArrowLeft className="h-4 w-4" />
                <span className="sr-only">Back to Document Hub</span>
            </Link>
        </Button>
        <div className="flex-1 min-w-0 px-4">
            {doc && <h1 className="text-lg font-bold truncate">{doc.title}</h1>}
        </div>
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="shrink-0">
                    <MoreVertical className="h-5 w-5" />
                    <span className="sr-only">More options</span>
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={handleOpenPreview}>
                    <Eye className="mr-2 h-4 w-4" /> Preview
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setIsHistoryOpen(true)}>
                    <History className="mr-2 h-4 w-4" /> History
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setIsSidebarOpen(true)}>
                    <PanelRight className="mr-2 h-4 w-4" /> Details
                </DropdownMenuItem>
                 <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                       <div className="relative flex cursor-default select-none items-center gap-2 rounded-sm px-2 py-1.5 text-sm outline-none transition-colors focus:bg-accent focus:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50">
                          <Download className="mr-2 h-4 w-4" /> Export
                       </div>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={handleDocxExport}><FileText className="mr-2 h-4 w-4" />Export as DOCX</DropdownMenuItem>
                        <DropdownMenuItem onClick={handleJsonExport}><Braces className="mr-2 h-4 w-4" />Export as JSON</DropdownMenuItem>
                        <DropdownMenuItem onClick={handleHtmlExport}><FileCode2 className="mr-2 h-4 w-4" />Export as HTML</DropdownMenuItem>
                        <DropdownMenuItem onClick={handleMarkdownExport}><BookOpen className="mr-2 h-4 w-4" />Export as Markdown</DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            </DropdownMenuContent>
        </DropdownMenu>
    </div>
  ) : (
    <>
        <div className="flex items-center gap-4 flex-1 min-w-0">
            <Button variant="outline" size="icon" className="shrink-0" asChild>
                <Link href="/documents">
                <ArrowLeft className="h-4 w-4" />
                <span className="sr-only">Back to Document Hub</span>
                </Link>
            </Button>
            <div className="flex-1 min-w-0">
                {doc && <h1 className="text-xl font-bold font-headline text-primary truncate">{doc.title}</h1>}
            </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => setIsHistoryOpen(true)}>
            <History className="h-4 w-4 md:mr-2" />
            <span className="hidden md:inline">History</span>
          </Button>
          <Button variant="outline" size="sm" onClick={handleOpenPreview} className="relative">
            <Eye className="h-4 w-4 md:mr-2" />
            <span className="hidden md:inline">Preview</span>
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" disabled={isExporting} className="relative w-[135px]">
                    {isExporting ? <Loader2 className="h-4 w-4 animate-spin" /> : <> <Download className="h-4 w-4 md:mr-2" /> <span className="hidden md:inline">Export</span> </>}
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={handleDocxExport}><FileText className="mr-2 h-4 w-4" />Export as DOCX</DropdownMenuItem>
                <DropdownMenuItem onClick={handleJsonExport}><Braces className="mr-2 h-4 w-4" />Export as JSON</DropdownMenuItem>
                <DropdownMenuItem onClick={handleHtmlExport}><FileCode2 className="mr-2 h-4 w-4" />Export as HTML</DropdownMenuItem>
                <DropdownMenuItem onClick={handleMarkdownExport}><BookOpen className="mr-2 h-4 w-4" />Export as Markdown</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          <Button variant="ghost" size="icon" onClick={() => setIsSidebarOpen(true)}>
            <PanelRight className="h-5 w-5" />
            <span className="sr-only">Open Sidebar</span>
          </Button>
        </div>
    </>
  );

  return (
    <>
      <div className="flex flex-col min-h-screen bg-primary/5">
        <header className={cn("sticky top-0 z-30 flex items-center justify-between border-b bg-background", isMobile ? "p-2 h-auto" : "p-4 h-auto")}>
            {headerContent}
        </header>
        <main className="flex-1 flex flex-col min-h-0">
            <TiptapEditor 
                editor={editor}
                onAiAssistantClick={() => setIsAiAssistantOpen(true)}
                onAddToggleClick={() => setIsToggleModalOpen(true)}
                onOpenEquationModal={() => setIsEquationModalOpen(true)}
                isMobile={isMobile}
            />
        </main>
      </div>
      <VersionHistory 
        isOpen={isHistoryOpen} 
        onClose={() => setIsHistoryOpen(false)} 
        docId={docId}
        editor={editor}
      />
      {doc && (
        <Sheet open={isSidebarOpen} onOpenChange={setIsSidebarOpen}>
            <SheetContent className="w-full sm:max-w-sm p-0">
                <EditorSidebar 
                    doc={doc}
                    tags={tags}
                    onTagsChange={handleTagsChange}
                    onMetadataUpdate={handleMetadataUpdate}
                />
            </SheetContent>
        </Sheet>
      )}
      <PrintPreview isOpen={isPreviewOpen} onClose={() => setIsPreviewOpen(false)} content={currentContent} />
      <AiAssistantDialog open={isAiAssistantOpen} onOpenChange={setIsAiAssistantOpen} editor={editor} />
      <ToggleTemplateModal isOpen={isToggleModalOpen} onClose={() => setIsToggleModalOpen(false)} onSelect={handleSelectToggle} />
      <EquationModal isOpen={isEquationModalOpen} onClose={() => setIsEquationModalOpen(false)} onInsert={handleInsertEquation} />
      <DocSearchModal isOpen={isDocSearchOpen} onClose={() => setIsDocSearchOpen(false)} onSelect={handleSelectDocLink} currentDocId={docId} />
    </>
  );
}
