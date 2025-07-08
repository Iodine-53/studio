
'use client';

import { useState } from 'react';
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
import { Input } from './ui/input';
import { Loader2, Wand2 } from 'lucide-react';
import { generateImage } from '@/ai/flows/generate-image-flow';
import { useToast } from '@/hooks/use-toast';
import { useUserApiKey } from '@/hooks/use-user-api-key';

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onGenerate: (src: string) => void;
};

export function GenerateImageDialog({ open, onOpenChange, onGenerate }: Props) {
  const [prompt, setPrompt] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const { getApiKey } = useUserApiKey();

  const handleGenerate = async () => {
    if (!prompt) return;
    setIsLoading(true);
    try {
      const fullPrompt = `An image of ${prompt}`;
      const apiKey = getApiKey() || undefined;
      const result = await generateImage({ prompt: fullPrompt, apiKey });
      onGenerate(result);
      onOpenChange(false);
      setPrompt('');
    } catch (error) {
      console.error('AI image generation failed:', error);
      const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred. Please try again.';
      toast({
        variant: 'destructive',
        title: 'Image Generation Failed',
        description: errorMessage,
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Generate Image with AI</DialogTitle>
          <DialogDescription>
            Describe the image you want to create. Be specific for the best results.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid w-full items-center gap-1.5">
            <Label htmlFor="image-prompt">Image Prompt</Label>
            <div className="flex items-center rounded-md border border-input focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2">
              <span className="pl-3 text-sm text-muted-foreground">An image of</span>
              <Input
                id="image-prompt"
                placeholder="a cat wearing sunglasses"
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    handleGenerate();
                  }
                }}
                className="border-0 shadow-none focus-visible:ring-0 focus-visible:ring-offset-0 flex-1"
              />
            </div>
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
