'use client';

import { useState } from 'react';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from '@/components/ui/dialog';
import { Button } from './ui/button';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { Loader2, Wand2 } from 'lucide-react';
import { generateProgressBarData, type GenerateProgressBarDataOutput } from '@/ai/flows/generate-progress-bar-data-flow';
import { useToast } from '@/hooks/use-toast';
import { useUserApiKey } from '@/hooks/use-user-api-key';

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onGenerate: (data: GenerateProgressBarDataOutput) => void;
};

export function GenerateProgressBarDataDialog({ open, onOpenChange, onGenerate }: Props) {
  const [prompt, setPrompt] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const { getApiKey } = useUserApiKey('gemini');

  const handleGenerate = async () => {
    if (!prompt) return;
    setIsLoading(true);
    try {
      const apiKey = getApiKey() || undefined;
      if (!apiKey) {
        throw new Error("Missing Gemini API Key. Please click the Settings icon (gear) in the header to enter your key.");
      }
      const result = await generateProgressBarData({ prompt, apiKey });
      onGenerate(result);
      onOpenChange(false);
      setPrompt('');
    } catch (error) {
      console.error('AI bar chart data generation failed:', error);
      const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred.';
      toast({
        variant: 'destructive',
        title: 'Data Generation Failed',
        description: errorMessage,
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>Generate Bar Chart Data with AI</DialogTitle>
          <DialogDescription>
            Describe the data you want to display. The AI will generate a title and a set of labeled bars for you.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid w-full items-center gap-1.5">
            <Label htmlFor="progress-prompt">Prompt</Label>
            <Textarea
              id="progress-prompt"
              placeholder="e.g., 'a skill chart for a resume with skills in React, TypeScript, and Node.js'"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              rows={5}
            />
          </div>
        </div>
        <DialogFooter>
          <Button type="button" onClick={handleGenerate} disabled={isLoading || !prompt}>
            {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Wand2 className="mr-2 h-4 w-4" />}
            Generate Data
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
