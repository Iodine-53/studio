"use client";

import React, { useState } from "react";
import { BlockMath } from "react-katex";
import { Sigma, Info, Plus } from "lucide-react";
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
  const [latex, setLatex] = useState("\\frac{-b \\pm \\sqrt{b^2-4ac}}{2a}");

  const addSymbol = (symbol: string) => {
    setLatex((prev) => prev + symbol);
  };

  const handleInsert = () => {
    if (latex.trim()) {
      onInsert(latex);
    }
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl p-0 overflow-hidden border-none shadow-2xl">
        <div className="grid grid-cols-1 md:grid-cols-12">
          {/* Sidebar Editor */}
          <div className="md:col-span-7 p-6 space-y-6 bg-background">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-2xl font-headline">
                <div className="p-2 bg-primary/10 rounded-lg">
                  <Sigma className="h-6 w-6 text-primary" />
                </div>
                Equation Workspace
              </DialogTitle>
              <DialogDescription>
                Craft beautiful formulas using standard LaTeX.
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
                  autoFocus
                  className="h-48 resize-none font-mono text-base border-2 focus-visible:ring-primary/20"
                  placeholder="e.g. \sum_{i=1}^{n} i^2"
                />
              </div>

              <Tabs defaultValue="basic" className="w-full">
                <TabsList className="w-full justify-start h-auto bg-transparent border-b p-0 rounded-none mb-4">
                  <TabsTrigger value="basic" className="rounded-none border-b-2 border-transparent data-[state=active]:bg-transparent data-[state=active]:border-primary px-4 pb-2">Basic</TabsTrigger>
                  <TabsTrigger value="operators" className="rounded-none border-b-2 border-transparent data-[state=active]:bg-transparent data-[state=active]:border-primary px-4 pb-2">Operators</TabsTrigger>
                  <TabsTrigger value="greek" className="rounded-none border-b-2 border-transparent data-[state=active]:bg-transparent data-[state=active]:border-primary px-4 pb-2">Greek</TabsTrigger>
                </TabsList>
                
                <TabsContent value="basic" className="mt-0">
                  <div className="grid grid-cols-3 gap-2">
                    <Button variant="outline" size="sm" onClick={() => addSymbol("\\frac{a}{b}")} className="text-xs">Fraction</Button>
                    <Button variant="outline" size="sm" onClick={() => addSymbol("x^{n}")} className="text-xs">Power</Button>
                    <Button variant="outline" size="sm" onClick={() => addSymbol("x_{i}")} className="text-xs">Subscript</Button>
                    <Button variant="outline" size="sm" onClick={() => addSymbol("\\sqrt{x}")} className="text-xs">Sqrt</Button>
                    <Button variant="outline" size="sm" onClick={() => addSymbol("\\pm")} className="text-xs">Plus-Minus</Button>
                    <Button variant="outline" size="sm" onClick={() => addSymbol("\\infty")} className="text-xs">Infinity</Button>
                  </div>
                </TabsContent>
                
                <TabsContent value="operators" className="mt-0">
                  <div className="grid grid-cols-3 gap-2">
                    <Button variant="outline" size="sm" onClick={() => addSymbol("\\sum_{i=1}^{n}")} className="text-xs">Sum</Button>
                    <Button variant="outline" size="sm" onClick={() => addSymbol("\\int_{a}^{b}")} className="text-xs">Integral</Button>
                    <Button variant="outline" size="sm" onClick={() => addSymbol("\\prod")} className="text-xs">Product</Button>
                    <Button variant="outline" size="sm" onClick={() => addSymbol("\\lim_{x \\to \\infty}")} className="text-xs">Limit</Button>
                    <Button variant="outline" size="sm" onClick={() => addSymbol("\\sin")} className="text-xs">Sine</Button>
                    <Button variant="outline" size="sm" onClick={() => addSymbol("\\log")} className="text-xs">Log</Button>
                  </div>
                </TabsContent>
                
                <TabsContent value="greek" className="mt-0">
                  <div className="grid grid-cols-4 gap-2">
                    <Button variant="outline" size="sm" onClick={() => addSymbol("\\alpha")} className="text-xs">&alpha;</Button>
                    <Button variant="outline" size="sm" onClick={() => addSymbol("\\beta")} className="text-xs">&beta;</Button>
                    <Button variant="outline" size="sm" onClick={() => addSymbol("\\pi")} className="text-xs">&pi;</Button>
                    <Button variant="outline" size="sm" onClick={() => addSymbol("\\Delta")} className="text-xs">&Delta;</Button>
                    <Button variant="outline" size="sm" onClick={() => addSymbol("\\sigma")} className="text-xs">&sigma;</Button>
                    <Button variant="outline" size="sm" onClick={() => addSymbol("\\omega")} className="text-xs">&omega;</Button>
                    <Button variant="outline" size="sm" onClick={() => addSymbol("\\theta")} className="text-xs">&theta;</Button>
                    <Button variant="outline" size="sm" onClick={() => addSymbol("\\lambda")} className="text-xs">&lambda;</Button>
                  </div>
                </TabsContent>
              </Tabs>
            </div>
          </div>

          {/* Preview Panel */}
          <div className="md:col-span-5 p-6 bg-muted/30 border-l border-border/50 flex flex-col">
            <Label className="text-xs font-bold uppercase text-muted-foreground mb-4">
              High Fidelity Preview
            </Label>
            <div className="flex-1 min-h-[250px] flex items-center justify-center rounded-2xl bg-background shadow-inner border p-8 overflow-auto">
              <div className="max-w-full scale-150 origin-center transition-all duration-300">
                <BlockMath math={latex || "\\text{Start typing...}"} />
              </div>
            </div>
            
            <div className="mt-6 flex flex-col gap-3">
              <div className="flex items-start gap-2 p-3 bg-primary/5 rounded-xl border border-primary/10">
                <Info className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                <p className="text-[11px] text-muted-foreground leading-snug">
                  Pro Tip: Use <code>\\text{...}</code> for labels and <code>\\quad</code> for wide spacing.
                </p>
              </div>
              
              <div className="flex gap-2">
                <Button variant="ghost" onClick={onClose} className="flex-1">
                  Cancel
                </Button>
                <Button onClick={handleInsert} className="flex-1 gap-2 shadow-lg shadow-primary/20">
                  <Plus className="h-4 w-4" />
                  Insert Equation
                </Button>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
