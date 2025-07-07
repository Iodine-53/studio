
'use client';

import { useState } from 'react';
import type { Editor } from '@tiptap/react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from './ui/button';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { Loader2, Wand2 } from 'lucide-react';
import { generateText } from '@/ai/flows/generate-text-flow';
import { useToast } from '@/hooks/use-toast';

type Props = {
  editor: Editor | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function AiWriterDialog({ editor, open, onOpenChange }: Props) {
  const [prompt, setPrompt] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleGenerate = async () => {
    if (!editor || !prompt) return;

    setIsLoading(true);
    try {
      const result = await generateText(prompt);
      // Replace newline characters with HTML line breaks for proper rendering
      const formattedResult = result.replace(/\n/g, '<br>');
      editor.chain().focus().insertContent(formattedResult).run();
      onOpenChange(false); // Close dialog on success
      setPrompt(''); // Reset prompt
    } catch (error) {
      console.error('AI text generation failed:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to generate text. Please try again.',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>AI Writer</DialogTitle>
          <DialogDescription>
            Tell the AI what you want to write. Be as specific as you want.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid w-full gap-1.5">
            <Label htmlFor="ai-prompt">Your Prompt</Label>
            <Textarea
              id="ai-prompt"
              placeholder="e.g., 'Write a short poem about the moon' or 'Create a three-column table of pros and cons for remote work'"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              rows={5}
            />
          </div>
        </div>
        <DialogFooter>
          <Button
            type="button"
            onClick={handleGenerate}
            disabled={isLoading || !prompt}
          >
            {isLoading ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Wand2 className="mr-2 h-4 w-4" />
            )}
            Generate
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
