
'use client';

import { useState, useEffect, useRef } from 'react';
import type { Editor } from '@tiptap/react';
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
import { Loader2, Wand2, Sparkles, Send, FileText, Trash2 } from 'lucide-react';
import { generateText } from '@/ai/flows/generate-text-flow';
import { brainstormIdeas, type BrainstormIdeasOutput } from '@/ai/flows/brainstorm-ideas';
import { generateDocument, type GenerateDocumentOutput } from '@/ai/flows/generate-document-flow';
import { useToast } from '@/hooks/use-toast';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from './ui/scroll-area';
import { cn } from '@/lib/utils';
import { useUserApiKey } from '@/hooks/use-user-api-key';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

type Props = {
  editor: Editor | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

type BrainstormMessage = {
    role: 'user' | 'model';
    content: string;
}

type StoredBrainstormChat = {
    timestamp: number;
    messages: BrainstormMessage[];
};

const BRAINSTORM_STORAGE_KEY = 'brainstormChatHistory';

// Write Tab Component
const WriteTab = ({ editor, onOpenChange }: Pick<Props, 'editor' | 'onOpenChange'>) => {
    const [prompt, setPrompt] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const { toast } = useToast();
    const { getApiKey } = useUserApiKey();

    const handleGenerate = async () => {
        if (!editor || !prompt) return;

        setIsLoading(true);
        try {
            const apiKey = getApiKey();
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
    const { getApiKey } = useUserApiKey();

    const handleGenerateList = async () => {
        if (!editor || !prompt) return;

        setIsLoading(true);
        try {
            const apiKey = getApiKey();
            if (!apiKey) {
              throw new Error("A Gemini API key is required. Please set it in the settings.");
            }
            const result = await generateDocument({ prompt, apiKey });
            
            // Convert the AI's block-based response into Tiptap's JSON format
            const contentToInsert = result.blocks.map(block => {
                switch (block.type) {
                    case 'heading':
                        return {
                            type: 'heading',
                            attrs: { level: (block as any).level },
                            content: [{ type: 'text', text: (block as any).content }],
                        };
                    case 'paragraph':
                        return {
                            type: 'paragraph',
                            content: [{ type: 'text', text: (block as any).content }],
                        };
                    case 'bulletList':
                    case 'orderedList':
                        return {
                            type: block.type,
                            content: (block as any).items.map((item: string) => ({
                                type: 'listItem',
                                content: [{
                                    type: 'paragraph',
                                    content: [{ type: 'text', text: item }],
                                }],
                            })),
                        };
                    default:
                        return null;
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
            toast({
                variant: 'destructive',
                title: 'Generation Failed',
                description: errorMessage,
            });
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="grid gap-4 py-4">
            <div className="grid w-full gap-1.5">
                <Label htmlFor="doc-prompt">List Prompt</Label>
                <Textarea
                    id="doc-prompt"
                    placeholder="e.g., 'a bulleted list of the top 5 benefits of exercise'"
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    rows={8}
                />
            </div>
             <Button
                type="button"
                onClick={handleGenerateList}
                disabled={isLoading || !prompt}
            >
                {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <FileText className="mr-2 h-4 w-4" />}
                Generate List
            </Button>
        </div>
    )
}

// Brainstorm Tab Component
const BrainstormTab = ({ editor }: { editor: Editor | null }) => {
    const [inputValue, setInputValue] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [messages, setMessages] = useState<BrainstormMessage[]>([]);
    const { toast } = useToast();
    const { getApiKey } = useUserApiKey();
    const isInitialMount = useRef(true);

    // Load messages from localStorage on initial render
    useEffect(() => {
        const storedData = localStorage.getItem(BRAINSTORM_STORAGE_KEY);
        if (storedData) {
            try {
                const { timestamp, messages: storedMessages }: StoredBrainstormChat = JSON.parse(storedData);
                const now = new Date().getTime();
                const twentyFourHours = 24 * 60 * 60 * 1000;

                // Check if the stored data is less than 24 hours old
                if (now - timestamp < twentyFourHours) {
                    // Sanitize messages to handle legacy data structures
                    const sanitizedMessages = storedMessages.map((msg: any) => ({
                        role: msg.role === 'ai' ? 'model' : msg.role,
                        content: Array.isArray(msg.content) ? msg.content.join('\n\n') : String(msg.content),
                    }));
                    setMessages(sanitizedMessages);
                } else {
                    // If it's expired, remove it from storage
                    localStorage.removeItem(BRAINSTORM_STORAGE_KEY);
                }
            } catch (error) {
                console.error("Failed to parse brainstorm chat history, clearing storage.", error);
                localStorage.removeItem(BRAINSTORM_STORAGE_KEY);
            }
        }
    }, []); // Empty dependency array ensures this runs only once on mount

    // Save messages to localStorage whenever they change, skipping the initial render
    useEffect(() => {
        if (isInitialMount.current) {
            isInitialMount.current = false;
            return;
        }

        if (messages.length > 0) {
            const dataToStore: StoredBrainstormChat = {
                timestamp: new Date().getTime(),
                messages,
            };
            localStorage.setItem(BRAINSTORM_STORAGE_KEY, JSON.stringify(dataToStore));
        } else {
            // If the chat becomes empty, clear it from storage
            localStorage.removeItem(BRAINSTORM_STORAGE_KEY);
        }
    }, [messages]);


    const handleBrainstorm = async () => {
        if (!inputValue) return;

        let userPrompt = inputValue;
        let documentContext: string | undefined = undefined;

        if (userPrompt.startsWith('/')) {
            if (editor) {
                documentContext = JSON.stringify(editor.getJSON());
            } else {
                toast({
                    variant: 'destructive',
                    title: 'Editor not available',
                    description: 'Could not access document context.',
                });
            }
            // Remove the slash and any leading space from the prompt
            userPrompt = userPrompt.substring(1).trim();
        }

        const newUserMessage: BrainstormMessage = { role: 'user', content: userPrompt };
        const updatedMessages = [...messages, newUserMessage];
        setMessages(updatedMessages);
        setInputValue('');
        setIsLoading(true);

        try {
            const apiKey = getApiKey();
            if (!apiKey) {
              throw new Error("A Gemini API key is required. Please set it in the settings.");
            }
            
            // The history for the model is everything in the conversation.
            const historyForModel = updatedMessages.map(msg => ({
                role: msg.role,
                content: msg.content,
            }));

            const response = await brainstormIdeas({ 
                history: historyForModel, 
                apiKey,
                documentContext 
            });

            setMessages([...updatedMessages, { role: 'model', content: response.response }]);
        } catch (error) {
            console.error('AI brainstorming failed:', error);
            const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred.';
            toast({
                variant: 'destructive',
                title: 'Error',
                description: errorMessage,
            });
            // remove the user message if it fails
            setMessages(messages);
        } finally {
            setIsLoading(false);
        }
    };
    
    const handleClearChat = () => {
        setMessages([]);
        toast({
            title: "Chat Cleared",
            description: "Your brainstorming history has been reset.",
        });
    };
    
    return (
        <div className="flex flex-col h-[400px]">
            <ScrollArea className="flex-1 p-4">
                <div className="space-y-4">
                    {messages.length === 0 && (
                        <div className="text-center text-sm text-muted-foreground py-8">
                            <Sparkles className="mx-auto h-8 w-8 mb-2" />
                            <p>This is a brainstorming space.</p>
                            <p>Type <code className="bg-muted px-1.5 py-1 rounded-sm">/</code> to ask about your document.</p>
                        </div>
                    )}
                    {messages.map((message, index) => (
                        <div key={index} className={cn("flex", message.role === 'user' ? 'justify-end' : 'justify-start')}>
                             <div className={cn("rounded-lg px-4 py-2 max-w-sm", message.role === 'user' ? 'bg-primary text-primary-foreground' : 'bg-muted')}>
                                 <p>{message.content}</p>
                            </div>
                        </div>
                    ))}
                    {isLoading && (
                         <div className="flex justify-start">
                              <div className="rounded-lg px-4 py-2 bg-muted flex items-center gap-2">
                                <Loader2 className="h-4 w-4 animate-spin"/>
                                <span className="text-sm text-muted-foreground">Thinking...</span>
                            </div>
                        </div>
                    )}
                </div>
            </ScrollArea>
            <div className="p-4 border-t">
                 <div className="flex items-center gap-2">
                    <Input
                        value={inputValue}
                        onChange={(e) => setInputValue(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && !isLoading && handleBrainstorm()}
                        placeholder="Ask for ideas, or type '/' for document context..."
                        disabled={isLoading}
                    />
                    <Button onClick={handleBrainstorm} disabled={isLoading || !inputValue}><Send className="h-4 w-4" /></Button>
                    {messages.length > 0 && !isLoading && (
                        <TooltipProvider>
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <Button variant="outline" size="icon" onClick={handleClearChat}>
                                        <Trash2 className="h-4 w-4" />
                                    </Button>
                                </TooltipTrigger>
                                <TooltipContent>
                                    <p>Clear Chat History</p>
                                </TooltipContent>
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
         <Tabs defaultValue="write" className="w-full">
            <DialogHeader className="p-6 pb-0">
                 <DialogTitle>AI Assistant</DialogTitle>
                 <DialogDescription>
                    Use AI to write new content, generate lists, or brainstorm ideas.
                 </DialogDescription>
                 <TabsList className="grid w-full grid-cols-3 mt-4">
                    <TabsTrigger value="write">Write</TabsTrigger>
                    <TabsTrigger value="list">List</TabsTrigger>
                    <TabsTrigger value="brainstorm">Brainstorm</TabsTrigger>
                 </TabsList>
            </DialogHeader>

            <TabsContent value="write" className="p-6 pt-0">
                <WriteTab editor={editor} onOpenChange={onOpenChange}/>
            </TabsContent>
            
            <TabsContent value="list" className="p-6 pt-0">
                <ListTab editor={editor} onOpenChange={onOpenChange}/>
            </TabsContent>

            <TabsContent value="brainstorm" className="m-0 p-0">
                <BrainstormTab editor={editor} />
            </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
