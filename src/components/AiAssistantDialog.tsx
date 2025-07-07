
'use client';

import { useState } from 'react';
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
import { Loader2, Wand2, Sparkles, Send } from 'lucide-react';
import { generateDocument, type GenerateDocumentOutput } from '@/ai/flows/generate-document-flow';
import { brainstormIdeas } from '@/ai/flows/brainstorm-ideas';
import { useToast } from '@/hooks/use-toast';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from './ui/scroll-area';
import { cn } from '@/lib/utils';

type Props = {
  editor: Editor | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

type BrainstormMessage = {
    role: 'user' | 'ai';
    content: string | string[]; // AI can return a list of ideas
}

// Helper to convert AI output to Tiptap nodes
const convertToTiptap = (aiOutput: GenerateDocumentOutput) => {
    if (!aiOutput || !aiOutput.blocks) return [];

    return aiOutput.blocks.map(block => {
        switch (block.type) {
            case 'heading':
                return {
                    type: 'heading',
                    attrs: { level: block.level },
                    content: [{ type: 'text', text: block.content }],
                };
            case 'paragraph':
                return {
                    type: 'paragraph',
                    content: [{ type: 'text', text: block.content }],
                };
            case 'bulletList':
            case 'orderedList':
                return {
                    type: block.type,
                    content: block.items.map(item => ({
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
    }).filter(Boolean); // Filter out any null values from unknown block types
};


// Write Tab Component
const WriteTab = ({ editor, onOpenChange }: Pick<Props, 'editor' | 'onOpenChange'>) => {
    const [prompt, setPrompt] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const { toast } = useToast();

    const handleGenerate = async () => {
        if (!editor || !prompt) return;

        setIsLoading(true);
        try {
            const result = await generateDocument({ prompt });
            const tiptapNodes = convertToTiptap(result);

            if (tiptapNodes.length > 0) {
                editor.chain().focus().insertContent(tiptapNodes).run();
            }
            
            onOpenChange(false);
            setPrompt('');
        } catch (error) {
            console.error('AI document generation failed:', error);
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
                    placeholder="e.g., 'Write a blog post about the benefits of hydration, including a list of tips.'"
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

// Brainstorm Tab Component
const BrainstormTab = () => {
    const [inputValue, setInputValue] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [messages, setMessages] = useState<BrainstormMessage[]>([]);
    const { toast } = useToast();

    const handleBrainstorm = async () => {
        if (!inputValue) return;
        const newMessages: BrainstormMessage[] = [...messages, { role: 'user', content: inputValue }];
        setMessages(newMessages);
        setInputValue('');
        setIsLoading(true);

        try {
            const response = await brainstormIdeas({ topic: inputValue });
            setMessages([...newMessages, { role: 'ai', content: response.ideas }]);
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
    }
    
    return (
        <div className="flex flex-col h-[400px]">
            <ScrollArea className="flex-1 p-4">
                <div className="space-y-4">
                    {messages.length === 0 && (
                        <div className="text-center text-sm text-muted-foreground py-8">
                            <Sparkles className="mx-auto h-8 w-8 mb-2" />
                            <p>This is a brainstorming space.</p>
                            <p>Content generated here will not be added to your document.</p>
                        </div>
                    )}
                    {messages.map((message, index) => (
                        <div key={index} className={cn("flex", message.role === 'user' ? 'justify-end' : 'justify-start')}>
                             <div className={cn("rounded-lg px-4 py-2 max-w-sm", message.role === 'user' ? 'bg-primary text-primary-foreground' : 'bg-muted')}>
                                {Array.isArray(message.content) ? (
                                    <ul className="list-disc list-inside space-y-1">
                                        {message.content.map((idea, i) => <li key={i}>{idea}</li>)}
                                    </ul>
                                ) : (
                                    <p>{message.content}</p>
                                )}
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
                        placeholder="Ask for ideas..."
                        disabled={isLoading}
                    />
                    <Button onClick={handleBrainstorm} disabled={isLoading || !inputValue}><Send className="h-4 w-4" /></Button>
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
                    Use AI to write new content or brainstorm ideas.
                 </DialogDescription>
                 <TabsList className="grid w-full grid-cols-2 mt-4">
                    <TabsTrigger value="write">Write</TabsTrigger>
                    <TabsTrigger value="brainstorm">Brainstorm</TabsTrigger>
                 </TabsList>
            </DialogHeader>

            <TabsContent value="write" className="p-6 pt-0">
                <WriteTab editor={editor} onOpenChange={onOpenChange}/>
            </TabsContent>

            <TabsContent value="brainstorm" className="m-0 p-0">
                <BrainstormTab />
            </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
