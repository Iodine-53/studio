
'use client';

import { useState, useEffect } from 'react';
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
import { KeyRound, AlertTriangle, Loader2 } from 'lucide-react';
import { Separator } from './ui/separator';
import { deleteDatabase } from '@/lib/db';

interface ApiKeyDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ApiKeyDialog({ open, onOpenChange }: ApiKeyDialogProps) {
  const [geminiKey, setGeminiKey] = useState('');
  const [isResetting, setIsResetting] = useState(false);
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

  const handleReset = async () => {
    const confirmation = window.prompt('This action is irreversible. To confirm, type "DELETE" in the box below.');
    if (confirmation !== 'DELETE') {
        toast({
            variant: 'default',
            title: 'Reset Cancelled',
            description: 'Your data has not been deleted.',
        });
        return;
    }

    setIsResetting(true);
    try {
        await deleteDatabase();
        toast({
            title: 'Application Reset',
            description: 'All data has been deleted. The app will now reload.',
        });
        // Wait a moment for the toast to be seen before reloading
        setTimeout(() => {
            window.location.reload();
        }, 2000);
    } catch (error) {
        console.error("Failed to reset database:", error);
        toast({
            variant: 'destructive',
            title: 'Reset Failed',
            description: 'Could not delete the database. Please try clearing your browser\'s site data manually.',
        });
        setIsResetting(false);
    }
  };
  
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Settings</DialogTitle>
          <DialogDescription>
            Manage your API keys and application data.
          </DialogDescription>
        </DialogHeader>
        <div className="py-2">
            <Label htmlFor="gemini-api-key">Gemini API Key</Label>
            <div className="relative mt-1">
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
        <DialogFooter className="border-t pt-4">
          <Button type="button" onClick={handleSave} disabled={!geminiKey}>
            Save Key
          </Button>
        </DialogFooter>

        <Separator className="my-4" />

        <div className="space-y-3 rounded-lg border border-destructive/50 p-4">
            <div className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-destructive" />
                <h3 className="font-semibold text-destructive">Danger Zone</h3>
            </div>
            <p className="text-sm text-muted-foreground">
                Resetting the application will permanently delete all of your documents. This action cannot be undone.
            </p>
            <Button variant="destructive" className="w-full" onClick={handleReset} disabled={isResetting}>
                {isResetting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {isResetting ? 'Resetting...' : 'Reset Application & Delete All Data'}
            </Button>
        </div>

      </DialogContent>
    </Dialog>
  );
}
