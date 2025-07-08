
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
import { Textarea } from './ui/textarea';
import { Loader2, Wand2 } from 'lucide-react';
import { generateTableData, type GenerateTableDataOutput } from '@/ai/flows/generate-table-data-flow';
import { useToast } from '@/hooks/use-toast';
import { useUserApiKey } from '@/hooks/use-user-api-key';

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onGenerate: (data: GenerateTableDataOutput) => void;
};

export function GenerateTableDataDialog({ open, onOpenChange, onGenerate }: Props) {
  const [prompt, setPrompt] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const { getApiKey } = useUserApiKey();

  const handleGenerate = async () => {
    if (!prompt) return;
    setIsLoading(true);
    try {
      const apiKey = getApiKey() || undefined;
      const result = await generateTableData({ prompt, apiKey });
      onGenerate(result);
      onOpenChange(false);
      setPrompt('');
    } catch (error) {
      console.error('AI table data generation failed:', error);
      const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred. Please try again.';
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
          <DialogTitle>Generate Table Data with AI</DialogTitle>
          <DialogDescription>
            Describe the data you want to create. The AI will generate the headers and rows for you.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid w-full items-center gap-1.5">
            <Label htmlFor="table-prompt">Prompt</Label>
            <Textarea
              id="table-prompt"
              placeholder="e.g., 'a table of the 5 most populated countries with their capital and population'"
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
            Generate Data
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
