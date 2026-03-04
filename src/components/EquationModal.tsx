"use client";

import React from "react";
import { BlockMath } from "react-katex";
import { Sigma, Plus } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import "katex/dist/katex.min.css";

interface EquationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onInsert: (latex: string) => void;
}

export function EquationModal({ isOpen, onClose, onInsert }: EquationModalProps) {
  const [latex, setLatex] = React.useState("\\frac{-b \\pm \\sqrt{b^2-4ac}}{2a}");

  React.useEffect(() => {
    if (isOpen) {
      setLatex("\\frac{-b \\pm \\sqrt{b^2-4ac}}{2a}");
    }
  }, [isOpen]);

  const handleInsert = () => {
    if (latex.trim()) {
      onInsert(latex);
    }
    onClose();
  };

  const addSymbol = (symbol: string) => {
    setLatex((prev) => prev + symbol);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl p-0 overflow-hidden border-none shadow-2xl">
        <div className="grid grid-cols-1 md:grid-cols-12">
          {/* Editor Side */}
          <div className="md:col-span-7 p-6 space-y-6 bg-background">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-2xl font-headline text-primary">
                <div className="p-2 bg-primary/10 rounded-lg">
                  <Sigma className="h-6 w-6 text-primary" />
                </div>
                Equation Workspace
              </DialogTitle>
              <DialogDescription>
                Compose your formula using LaTeX notation.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="latex-input" className="text-xs font-bold uppercase text-muted-foreground">
                  LaTeX Input
                </Label>
                <Textarea
                  id="latex-input"
                  value={latex}
                  onChange={(e) => setLatex(e.target.value)}
                  className="h-48 font-mono text-base resize-none border-2 focus-visible:ring-primary/20"
                  placeholder="e.g. \sum_{i=1}^{n} i^2"
                />
              </div>

              <Tabs defaultValue="basic" className="w-full">
                <TabsList className="w-full justify-start border-b rounded-none bg-transparent h-auto p-0 mb-4">
                  <TabsTrigger value="basic" className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-4 pb-2">Basic</TabsTrigger>
                  <TabsTrigger value="greek" className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-4 pb-2">Greek</TabsTrigger>
                </TabsList>
                <TabsContent value="basic" className="grid grid-cols-3 gap-2 mt-0">
                  <Button variant="outline" size="sm" onClick={() => addSymbol("\\frac{a}{b}")} className="text-xs">Fraction</Button>
                  <Button variant="outline" size="sm" onClick={() => addSymbol("x^{n}")} className="text-xs">Power</Button>
                  <Button variant="outline" size="sm" onClick={() => addSymbol("\\sqrt{x}")} className="text-xs">Square Root</Button>
                  <Button variant="outline" size="sm" onClick={() => addSymbol("\\sum_{i=1}^{n}")} className="text-xs">Summation</Button>
                  <Button variant="outline" size="sm" onClick={() => addSymbol("\\int_{a}^{b}")} className="text-xs">Integral</Button>
                  <Button variant="outline" size="sm" onClick={() => addSymbol("\\pm")} className="text-xs">Plus-Minus</Button>
                </TabsContent>
                <TabsContent value="greek" className="grid grid-cols-4 gap-2 mt-0">
                  <Button variant="outline" size="sm" onClick={() => addSymbol("\\alpha")} className="text-xs">&alpha;</Button>
                  <Button variant="outline" size="sm" onClick={() => addSymbol("\\beta")} className="text-xs">&beta;</Button>
                  <Button variant="outline" size="sm" onClick={() => addSymbol("\\pi")} className="text-xs">&pi;</Button>
                  <Button variant="outline" size="sm" onClick={() => addSymbol("\\Delta")} className="text-xs">&Delta;</Button>
                  <Button variant="outline" size="sm" onClick={() => addSymbol("\\sigma")} className="text-xs">&sigma;</Button>
                  <Button variant="outline" size="sm" onClick={() => addSymbol("\\lambda")} className="text-xs">&lambda;</Button>
                  <Button variant="outline" size="sm" onClick={() => addSymbol("\\infty")} className="text-xs">&infin;</Button>
                  <Button variant="outline" size="sm" onClick={() => addSymbol("\\theta")} className="text-xs">&theta;</Button>
                </TabsContent>
              </Tabs>
            </div>
          </div>

          {/* Preview Side */}
          <div className="md:col-span-5 p-6 bg-muted/30 border-l flex flex-col">
            <Label className="text-xs font-bold uppercase text-muted-foreground mb-4">Live Preview</Label>
            <div className="flex-1 flex items-center justify-center bg-background rounded-2xl border shadow-inner p-8 overflow-auto min-h-[200px]">
              <div className="max-w-full scale-125 origin-center transition-all">
                <BlockMath math={latex || "\\text{Type something...}"} />
              </div>
            </div>
            
            <div className="mt-6 space-y-3">
              <div className="flex gap-2">
                <Button variant="ghost" onClick={onClose} className="flex-1">
                  Cancel
                </Button>
                <Button onClick={handleInsert} className="flex-1 gap-2 shadow-lg shadow-primary/20">
                  <Plus className="h-4 w-4" />
                  Insert
                </Button>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
