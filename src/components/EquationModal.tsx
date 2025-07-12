
"use client";

import { useState, type FC } from 'react';
import { BlockMath } from 'react-katex';
import 'katex/dist/katex.min.css';
import { X } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from './ui/button';
import { Textarea } from './ui/textarea';
import { Label } from './ui/label';

type EquationModalProps = {
  isOpen: boolean;
  onClose: () => void;
  onInsert: (latex: string) => void;
};

export const EquationModal: FC<EquationModalProps> = ({ isOpen, onClose, onInsert }) => {
  const [latex, setLatex] = useState('\\frac{-b \\pm \\sqrt{b^2-4ac}}{2a}');

  if (!isOpen) {
    return null;
  }

  const handleInsert = () => {
    onInsert(latex);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-2xl">
            <DialogHeader>
                <DialogTitle>Equation Editor</DialogTitle>
            </DialogHeader>

            <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="latex-input">Enter LaTeX</Label>
                <Textarea
                  id="latex-input"
                  value={latex}
                  onChange={(e) => setLatex(e.target.value)}
                  autoFocus
                  className="mt-1 h-48 resize-none font-mono text-sm"
                />
              </div>

              <div>
                <Label>Live Preview</Label>
                <div className="mt-1 flex h-48 items-center justify-center rounded-md border border-dashed p-4">
                  <BlockMath math={latex} errorColor={'#cc0000'} />
                </div>
              </div>
            </div>
            
            <DialogFooter className="mt-6">
              <Button variant="ghost" onClick={onClose}>Cancel</Button>
              <Button onClick={handleInsert}>Insert Equation</Button>
            </DialogFooter>
        </DialogContent>
    </Dialog>
  );
};
