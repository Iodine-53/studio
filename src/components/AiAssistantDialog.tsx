
'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import type { Editor } from '@tiptap/react';
import mammoth from 'mammoth';
import * as pdfjs from 'pdfjs-dist';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from './ui/button';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { Input } from './ui/input';
import { Loader2, Wand2, Sparkles, Send, FileText, Trash2, Paperclip, X } from 'lucide-react';
import { generateText } from '@/ai/flows/generate-text-flow';
import { brainstormIdeas } from '@/ai/flows/brainstorm-ideas';
import { analyzeDocument } from '@/ai/flows/analyze-document-flow';
import { generateDocument } from '@/ai/flows/generate-document-flow';
import { useToast } from '@/hooks/use-toast';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from './ui/scroll-area';
import { cn } from '@/lib/utils';
import { useUserApiKey } from '@/hooks/use-user-api-key';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

// pdf.js worker configuration
if (typeof window !== 'undefined') {
  pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;
}

type Message = {
    role: 'user' | 'model';
    content: any;
}

type StoredChat = {
    timestamp: number;
    messages: Message[];
};

type Props = {
  editor: Editor | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};


const BRAINSTORM_STORAGE_KEY = 'brainstormChatHistory';

// Helper to generate a structured text representation of the document for AI context
const getDocumentContext = (node: any): string => {
  let text = '';
  if (!node || !node.type) return '';

  const getNodeText = (n: any): string => {
    return n.content?.map(getNodeText).join('') || (n.text || '');
  };

  switch (node.type) {
    case 'doc':
      return node.content?.map(getDocumentContext).join('\n\n') || '';
    
    case 'heading':
      const level = node.attrs?.level || 1;
      return `${'#'.repeat(level)} ${getNodeText(node)}`;
      
    case 'paragraph':
      const contentText = getNodeText(node);
      return contentText.trim() ? contentText : '';

    case 'bulletList':
    case 'orderedList':
      return node.content?.map((li: any, index: number) => {
        const prefix = node.type === 'bulletList' ? '- ' : `${index + 1}. `;
        return prefix + getDocumentContext(li);
      }).join('\n') || '';

    case 'listItem':
      return node.content?.map(getDocumentContext).join('\n') || '';

    case 'image':
      return `[An Image: ${node.attrs?.caption || 'No caption'}]`;
    case 'chartBlock': {
        const title = node.attrs?.title || 'Untitled Chart';
        let chartDataString = '[No Data]';
        try {
            if (node.attrs?.chartData) {
                const chartData = JSON.parse(node.attrs.chartData);
                chartDataString = JSON.stringify(chartData, null, 2); 
            }
        } catch (e) {
            chartDataString = '[Invalid Data Format]';
        }
        return `[A Chart titled: "${title}" with the following data:\n${chartDataString}]`;
    }
    case 'drawing': return `[A Drawing]`;
    case 'interactiveTable': {
        const title = node.attrs?.title || 'Untitled Table';
        let tableDataString = '[No Data]';
        try {
            const headers = JSON.parse(node.attrs.headers || '[]');
            const data = JSON.parse(node.attrs.data || '[]');
            if(headers.length > 0 && data.length > 0) {
                 const tableJson = { headers, data };
                 tableDataString = JSON.stringify(tableJson, null, 2);
            }
        } catch(e) {
            tableDataString = '[Invalid Table Data]';
        }
        return `[A Table titled: "${title}" with the following data:\n${tableDataString}]`;
    }
    case 'mindMap': return `[A Mind Map]`;
    case 'functionPlot': return `[A Function Plot for: f(x) = ${node.attrs?.fn}]`;
    case 'horizontalRule': return '---';
    case 'blockquote': return `> ${node.content?.map(getDocumentContext).join('\n').replace(/\n/g, '\n> ') || ''}`;
    case 'codeBlock': return `\`\`\`\n${getNodeText(node)}\n\`\`\``;
    case 'taskList': return node.content?.map((taskItem: any) => getDocumentContext(taskItem)).join('\n') || '';
    case 'taskItem': return `${node.attrs?.checked ? '[x]' : '[ ]'} ${getNodeText(node)}`;
    case 'callout': return `[Callout (${node.attrs?.type || 'info'}): ${getNodeText(node)}]`;
    default: return node.content ? node.content.map(getDocumentContext).join('') : (node.text || '');
  }
};


// Write Tab Component
const WriteTab = ({ editor, onOpenChange }: Pick<Props, 'editor' | 'onOpenChange'>) => {
    const [prompt, setPrompt] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const { toast } = useToast();
    const { getApiKey } = useUserApiKey('gemini');

    const handleGenerate = async () => {
        if (!editor || !prompt) return;

        setIsLoading(true);
        try {
            const apiKey = getApiKey() || undefined;
            if (!apiKey) {
              throw new Error("A Gemini API key is required. Please set it in the settings.");
            }
            const result = await generateText({ prompt, apiKey });

            if (result) {
                editor.chain().focus().insertContent(result).run();
            } else {
                 throw new Error('AI generation failed. The model returned no content. Please try rephrasing your prompt.');
            }
            
            onOpenChange(false);
            setPrompt('');
        } catch (error) {
            console.error('AI text generation failed:', error);
            const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred.';
            toast({
                variant: 'destructive',
                title: 'Error',
                description: errorMessage,
            });
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="grid gap-4 py-4">
            <div className="grid w-full gap-1.5">
                <Label htmlFor="ai-prompt">Your Prompt</Label>
                <Textarea
                    id="ai-prompt"
                    placeholder="e.g., 'Write a paragraph about the benefits of hydration.'"
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    rows={8}
                />
            </div>
             <Button
                type="button"
                onClick={handleGenerate}
                disabled={isLoading || !prompt}
            >
                {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Wand2 className="mr-2 h-4 w-4" />}
                Generate & Insert
            </Button>
        </div>
    )
}

// List Tab Component (Formerly DocumentTab)
const ListTab = ({ editor, onOpenChange }: Pick<Props, 'editor' | 'onOpenChange'>) => {
    const [prompt, setPrompt] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const { toast } = useToast();
    const { getApiKey } = useUserApiKey('gemini');

    const handleGenerateList = async () => {
        if (!editor || !prompt) return;

        setIsLoading(true);
        try {
            const apiKey = getApiKey() || undefined;
            if (!apiKey) {
              throw new Error("A Gemini API key is required. Please set it in the settings.");
            }
            const result = await generateDocument({ prompt, apiKey });
            
            const contentToInsert = result.blocks.map(block => {
                switch (block.type) {
                    case 'heading':
                        return { type: 'heading', attrs: { level: (block as any).level }, content: [{ type: 'text', text: (block as any).content }] };
                    case 'paragraph':
                        return { type: 'paragraph', content: [{ type: 'text', text: (block as any).content }] };
                    case 'bulletList':
                    case 'orderedList':
                        return { type: block.type, content: (block as any).items.map((item: string) => ({ type: 'listItem', content: [{ type: 'paragraph', content: [{ type: 'text', text: item }] }] }))};
                    default: return null;
                }
            }).filter(Boolean);

            if (contentToInsert.length > 0) {
                editor.chain().focus().insertContent(contentToInsert).run();
            } else {
                throw new Error("AI returned an empty or invalid document structure.");
            }

            onOpenChange(false);
            setPrompt('');
        } catch (error) {
            console.error('AI list generation failed:', error);
            const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred.';
            toast({ variant: 'destructive', title: 'Generation Failed', description: errorMessage });
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="grid gap-4 py-4">
            <div className="grid w-full gap-1.5">
                <Label htmlFor="doc-prompt">List Prompt</Label>
                <Textarea id="doc-prompt" placeholder="e.g., 'a bulleted list of the top 5 benefits of exercise'" value={prompt} onChange={(e) => setPrompt(e.target.value)} rows={8} />
            </div>
             <Button type="button" onClick={handleGenerateList} disabled={isLoading || !prompt}>
                {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <FileText className="mr-2 h-4 w-4" />}
                Generate List
            </Button>
        </div>
    )
}

// Brainstorm Tab Component
const BrainstormTab = ({ editor, onOpenChange }: { editor: Editor | null, onOpenChange: (open: boolean) => void }) => {
    const [inputValue, setInputValue] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [messages, setMessages] = useState<Message[]>([]);
    const [fileContext, setFileContext] = useState<{name: string, type: 'text' | 'image', content: string} | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    
    const { toast } = useToast();
    const { getApiKey } = useUserApiKey('gemini');
    const isInitialMount = useRef(true);
    
    useEffect(() => {
        const storedData = localStorage.getItem(BRAINSTORM_STORAGE_KEY);
        if (storedData) {
            try {
                const { timestamp, messages: storedMessages }: StoredChat = JSON.parse(storedData);
                if (new Date().getTime() - timestamp < 24 * 60 * 60 * 1000) {
                    setMessages(storedMessages);
                } else {
                    localStorage.removeItem(BRAINSTORM_STORAGE_KEY);
                }
            } catch (error) {
                console.error("Failed to parse chat history.", error);
                localStorage.removeItem(BRAINSTORM_STORAGE_KEY);
            }
        }
    }, []);

    useEffect(() => {
        if (isInitialMount.current) {
            isInitialMount.current = false;
            return;
        }
        if (messages.length > 0) {
            localStorage.setItem(BRAINSTORM_STORAGE_KEY, JSON.stringify({ timestamp: new Date().getTime(), messages }));
        } else {
            localStorage.removeItem(BRAINSTORM_STORAGE_KEY);
        }
    }, [messages]);

    const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        setIsLoading(true);
        toast({ title: 'Processing file...', description: `Reading "${file.name}"` });
        try {
            if (file.type.startsWith('image/')) {
                const reader = new FileReader();
                reader.onloadend = () => {
                    setFileContext({ name: file.name, type: 'image', content: reader.result as string });
                    setIsLoading(false);
                    toast({ title: 'File ready!', description: `You can now ask questions about ${file.name}.` });
                };
                reader.readAsDataURL(file);
            } else if (file.type === 'application/pdf') {
                const arrayBuffer = await file.arrayBuffer();
                const pdf = await pdfjs.getDocument(arrayBuffer).promise;
                let fullText = '';
                for (let i = 1; i <= pdf.numPages; i++) {
                    const page = await pdf.getPage(i);
                    const textContent = await page.getTextContent();
                    fullText += textContent.items.map(item => (item as any).str).join(' ');
                }
                setFileContext({ name: file.name, type: 'text', content: fullText });
                setIsLoading(false);
                toast({ title: 'File ready!', description: `You can now ask questions about ${file.name}.` });
            } else if (file.name.endsWith('.docx')) {
                const arrayBuffer = await file.arrayBuffer();
                const result = await mammoth.extractRawText({ arrayBuffer });
                setFileContext({ name: file.name, type: 'text', content: result.value });
                setIsLoading(false);
                toast({ title: 'File ready!', description: `You can now ask questions about ${file.name}.` });
            } else {
                throw new Error('Unsupported file type. Please upload an image, PDF, or DOCX file.');
            }
        } catch (error) {
            console.error('File processing error:', error);
            const errorMessage = error instanceof Error ? error.message : 'Could not process file.';
            toast({ variant: 'destructive', title: 'File Error', description: errorMessage });
            setIsLoading(false);
        }
        // Reset file input
        if (event.target) event.target.value = '';
    };

    const handleSendMessage = async () => {
        if (!inputValue.trim()) return;

        setIsLoading(true);
        const newUserMessage: Message = { role: 'user', content: inputValue };
        setMessages(prev => [...prev, newUserMessage]);
        setInputValue('');
        
        try {
            const apiKey = getApiKey();
            if (!apiKey) throw new Error("A Gemini API key is required. Please set it in the settings.");
            
            let response;
            if (fileContext) {
                const firstMessageContent = [{ text: `Here is the content of the file "${fileContext.name}":\n\n${fileContext.content}` }];
                if(fileContext.type === 'image') {
                    firstMessageContent[0] = { text: `Analyze this image named "${fileContext.name}"`};
                }

                const fileMessage = { role: 'user', content: fileContext.type === 'image' ? [{ media: { url: fileContext.content }}] : firstMessageContent };
                const historyWithFile = [fileMessage, ...messages, newUserMessage];
                response = await analyzeDocument({ history: historyWithFile, apiKey });
            } else {
                const docContext = editor ? getDocumentContext(editor.getJSON()) : undefined;
                const history = [...messages, newUserMessage];
                response = await brainstormIdeas({ history, apiKey, documentContext: docContext });
            }

            setMessages(prev => [...prev, { role: 'model', content: response.response }]);
        } catch (error) {
            console.error('AI chat failed:', error);
            const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred.';
            toast({ variant: 'destructive', title: 'Error', description: errorMessage });
            setMessages(messages); // Revert to previous state on error
        } finally {
            setIsLoading(false);
        }
    };
    
    const handleClearChat = () => {
        setMessages([]);
        setFileContext(null);
        toast({ title: "Chat Cleared", description: "Your chat history and file context have been reset." });
    };
    
    return (
        <div className="flex flex-col h-[450px]">
            <ScrollArea className="flex-1 p-4">
                <div className="space-y-4">
                    {messages.length === 0 && !fileContext && (
                        <div className="text-center text-sm text-muted-foreground py-8">
                            <Sparkles className="mx-auto h-8 w-8 mb-2" />
                            <p>Ask a general question, or upload a file.</p>
                            <p>Use `/` in your prompt to ask about the current document editor.</p>
                            <p className="text-xs text-muted-foreground/50 mt-2">Last updated October 2023</p>
                        </div>
                    )}
                    {messages.map((message, index) => (
                        <div key={index} className={cn("flex", message.role === 'user' ? 'justify-end' : 'justify-start')}>
                             <div className={cn("rounded-lg px-4 py-2 max-w-sm", message.role === 'user' ? 'bg-primary text-primary-foreground' : 'bg-muted')}>
                                 <p className="whitespace-pre-wrap">{message.content}</p>
                            </div>
                        </div>
                    ))}
                    {isLoading && !inputValue && (
                         <div className="flex justify-start">
                              <div className="rounded-lg px-4 py-2 bg-muted flex items-center gap-2">
                                <Loader2 className="h-4 w-4 animate-spin"/>
                                <span className="text-sm text-muted-foreground">Thinking...</span>
                            </div>
                        </div>
                    )}
                </div>
            </ScrollArea>
            <div className="p-4 border-t space-y-2">
                {fileContext && (
                    <div className="flex items-center justify-between bg-secondary text-secondary-foreground text-sm rounded-md px-3 py-1.5">
                        <div className="flex items-center gap-2 truncate">
                            <Paperclip className="h-4 w-4 flex-shrink-0" />
                            <span className="truncate" title={fileContext.name}>{fileContext.name}</span>
                        </div>
                        <button onClick={() => setFileContext(null)} className="p-1 rounded-full hover:bg-secondary/80">
                            <X className="h-4 w-4" />
                        </button>
                    </div>
                )}
                 <div className="flex items-center gap-2">
                    <Input
                        value={inputValue}
                        onChange={(e) => setInputValue(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && !isLoading && handleSendMessage()}
                        placeholder={fileContext ? `Ask about ${fileContext.name}...` : "Ask anything, or use '/'..."}
                        disabled={isLoading}
                    />
                    <TooltipProvider>
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <Button variant="outline" size="icon" onClick={() => fileInputRef.current?.click()} disabled={isLoading}>
                                    <Paperclip className="h-4 w-4" />
                                </Button>
                            </TooltipTrigger>
                            <TooltipContent><p>Attach file (PDF, DOCX, Image)</p></TooltipContent>
                        </Tooltip>
                    </TooltipProvider>
                    <input type="file" ref={fileInputRef} onChange={handleFileUpload} className="hidden" accept=".pdf,.docx,.png,.jpg,.jpeg,.webp" />

                    <Button onClick={handleSendMessage} disabled={isLoading || !inputValue.trim()}><Send className="h-4 w-4" /></Button>

                    {(messages.length > 0 || fileContext) && !isLoading && (
                        <TooltipProvider>
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <Button variant="outline" size="icon" onClick={handleClearChat}><Trash2 className="h-4 w-4" /></Button>
                                </TooltipTrigger>
                                <TooltipContent><p>Clear Chat & File</p></TooltipContent>
                            </Tooltip>
                        </TooltipProvider>
                    )}
                 </div>
            </div>
        </div>
    )
}


export function AiAssistantDialog({ editor, open, onOpenChange }: Props) {

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-xl p-0">
         <Tabs defaultValue="brainstorm" className="w-full">
            <DialogHeader className="p-6 pb-0">
                 <DialogTitle>AI Assistant</DialogTitle>
                 <DialogDescription>
                    Use AI to write new content, generate structured lists, or brainstorm ideas.
                 </DialogDescription>
                 <TabsList className="grid w-full grid-cols-3 mt-4">
                    <TabsTrigger value="brainstorm">Brainstorm</TabsTrigger>
                    <TabsTrigger value="write">Write</TabsTrigger>
                    <TabsTrigger value="list">List</TabsTrigger>
                 </TabsList>
            </DialogHeader>
            
            <TabsContent value="brainstorm" className="m-0 p-0">
                <BrainstormTab editor={editor} onOpenChange={onOpenChange} />
            </TabsContent>

            <TabsContent value="write" className="p-6 pt-0">
                <WriteTab editor={editor} onOpenChange={onOpenChange}/>
            </TabsContent>
            
            <TabsContent value="list" className="p-6 pt-0">
                <ListTab editor={editor} onOpenChange={onOpenChange}/>
            </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
