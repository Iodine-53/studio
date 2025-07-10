
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
import { generateChartData, type GenerateChartDataOutput } from '@/ai/flows/generate-chart-data-flow';
import { useToast } from '@/hooks/use-toast';
import { useUserApiKey } from '@/hooks/use-user-api-key';

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onGenerate: (data: GenerateChartDataOutput) => void;
};

export function GenerateChartDataDialog({ open, onOpenChange, onGenerate }: Props) {
  const [prompt, setPrompt] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const { getApiKey } = useUserApiKey('gemini');

  const handleGenerate = async () => {
    if (!prompt) return;
    setIsLoading(true);
    try {
      const apiKey = getApiKey() || undefined;
      const result = await generateChartData({ prompt, apiKey });
      onGenerate(result);
      onOpenChange(false);
      setPrompt('');
    } catch (error) {
      console.error('AI chart data generation failed:', error);
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
          <DialogTitle>Generate Chart Data with AI</DialogTitle>
          <DialogDescription>
            Describe the data you want to visualize. The AI will generate an array of data objects for you.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid w-full items-center gap-1.5">
            <Label htmlFor="chart-prompt">Prompt</Label>
            <Textarea
              id="chart-prompt"
              placeholder="e.g., 'monthly recurring revenue for the last 6 months'"
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
