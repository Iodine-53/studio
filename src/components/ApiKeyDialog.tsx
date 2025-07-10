
'use client';

import { useEffect, useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useUserApiKey } from '@/hooks/use-user-api-key';
import { useToast } from '@/hooks/use-toast';
import { KeyRound } from 'lucide-react';

interface ApiKeyDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ApiKeyDialog({ open, onOpenChange }: ApiKeyDialogProps) {
  const [geminiKey, setGeminiKey] = useState('');
  const { getApiKey, setApiKey } = useUserApiKey('gemini');
  const { toast } = useToast();

  useEffect(() => {
    if (open) {
      setGeminiKey(getApiKey() || '');
    }
  }, [open, getApiKey]);

  const handleSave = () => {
    setApiKey(geminiKey);
    toast({
      title: 'API Key Saved',
      description: 'Your Gemini key has been stored securely in your browser.',
    });
    onOpenChange(false);
  };
  
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Set Gemini API Key</DialogTitle>
          <DialogDescription>
            Your Gemini API key is stored only in your browser and is required for all AI features.
          </DialogDescription>
        </DialogHeader>
        <div className="py-4">
            <div className="relative">
                <KeyRound className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                    id="gemini-api-key"
                    type="password"
                    placeholder="Enter your Gemini API key..."
                    value={geminiKey}
                    onChange={(e) => setGeminiKey(e.target.value)}
                    className="pl-10"
                />
            </div>
        </div>
        <DialogFooter>
          <Button type="button" onClick={handleSave} disabled={!geminiKey}>
            Save Key
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
