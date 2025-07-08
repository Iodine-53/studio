
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
  const [keyInput, setKeyInput] = useState('');
  const { getApiKey, setApiKey, clearApiKey } = useUserApiKey();
  const { toast } = useToast();

  // When the dialog opens, load the current key from localStorage into the input field.
  useEffect(() => {
    if (open) {
      setKeyInput(getApiKey() || '');
    }
  }, [open, getApiKey]);

  const handleSave = () => {
    setApiKey(keyInput);
    toast({
      title: 'API Key Saved',
      description: 'Your Gemini API key has been stored in your browser.',
    });
    onOpenChange(false);
  };

  const handleClear = () => {
    clearApiKey();
    setKeyInput('');
    toast({
      title: 'API Key Cleared',
      description: 'Your Gemini API key has been removed.',
    });
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Set Your Gemini API Key</DialogTitle>
          <DialogDescription>
            Your API key is stored only in this browser's local storage and is never sent to our servers.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="relative">
            <KeyRound className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              id="api-key-input"
              type="password"
              placeholder="Enter your API key..."
              value={keyInput}
              onChange={(e) => setKeyInput(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>
        <DialogFooter className="sm:justify-between">
          <Button type="button" variant="outline" onClick={handleClear}>
            Clear Key
          </Button>
          <Button type="button" onClick={handleSave} disabled={!keyInput}>
            Save
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
