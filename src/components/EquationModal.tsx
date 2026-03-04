"use client";

import React, { useState } from "react";
import { BlockMath } from "react-katex";
import "katex/dist/katex.min.css";
import { Sigma, Sparkles, Info } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onInsert: (latex: string) => void;
}

export const EquationModal = ({ isOpen, onClose, onInsert }: Props) => {
  const [latex, setLatex] = useState("\\frac{-b \\pm \\sqrt{b^2-4ac}}{2a}");

  const addSymbol = (symbol: string) => {
    setLatex((prev) => prev + symbol);
  };

  const handleInsert = () => {
    onInsert(latex);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <Sigma className="h-5 w-5 text-primary" />
            Equation Workspace
          </DialogTitle>
          <DialogDescription>
            Create complex mathematical formulas using LaTeX. Your changes are previewed in real-time.
          </DialogDescription>
        </DialogHeader>

        <div className="mt-4 grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-7 space-y-4">
            <div className="space-y-2">
              <Label htmlFor="latex-input" className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                LaTeX Editor
              </Label>
              <Textarea
                id="latex-input"
                value={latex}
                onChange={(e) => setLatex(e.target.value)}
                autoFocus
                className="h-48 resize-none font-mono text-sm border-2 focus-visible:ring-primary/20"
                placeholder="Enter LaTeX here..."
              />
            </div>

            <Tabs defaultValue="basic" className="w-full">
              <TabsList className="w-full justify-start h-9 bg-transparent border-b rounded-none p-0 gap-4">
                <TabsTrigger 
                  value="basic" 
                  className="rounded-none px-0 pb-2 h-9 text-xs data-[state=active]:bg-transparent data-[state=active]:border-b-2 data-[state=active]:border-primary"
                >
                  Basic
                </TabsTrigger>
                <TabsTrigger 
                  value="operators" 
                  className="rounded-none px-0 pb-2 h-9 text-xs data-[state=active]:bg-transparent data-[state=active]:border-b-2 data-[state=active]:border-primary"
                >
                  Operators
                </TabsTrigger>
                <TabsTrigger 
                  value="greek" 
                  className="rounded-none px-0 pb-2 h-9 text-xs data-[state=active]:bg-transparent data-[state=active]:border-b-2 data-[state=active]:border-primary"
                >
                  Greek
                </TabsTrigger>
              </TabsList>
              
              <TabsContent value="basic" className="mt-2">
                <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                  <Button variant="outline" size="sm" className="text-[10px] h-8 px-1" onClick={() => addSymbol("\\frac{a}{b}")}>Fraction</Button>
                  <Button variant="outline" size="sm" className="text-[10px] h-8 px-1" onClick={() => addSymbol("x^{n}")}>Exponent</Button>
                  <Button variant="outline" size="sm" className="text-[10px] h-8 px-1" onClick={() => addSymbol("x_{i}")}>Subscript</Button>
                  <Button variant="outline" size="sm" className="text-[10px] h-8 px-1" onClick={() => addSymbol("\\sqrt{x}")}>Sqrt</Button>
                  <Button variant="outline" size="sm" className="text-[10px] h-8 px-1" onClick={() => addSymbol("\\sqrt[n]{x}")}>Nth Sqrt</Button>
                </div>
              </TabsContent>
              
              <TabsContent value="operators" className="mt-2">
                <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                  <Button variant="outline" size="sm" className="text-[10px] h-8 px-1" onClick={() => addSymbol("\\sum_{i=1}^{n}")}>Sum</Button>
                  <Button variant="outline" size="sm" className="text-[10px] h-8 px-1" onClick={() => addSymbol("\\int_{a}^{b}")}>Integral</Button>
                  <Button variant="outline" size="sm" className="text-[10px] h-8 px-1" onClick={() => addSymbol("\\prod")}>Product</Button>
                  <Button variant="outline" size="sm" className="text-[10px] h-8 px-1" onClick={() => addSymbol("\\lim_{x \\to \\infty}")}>Limit</Button>
                </div>
              </TabsContent>
              
              <TabsContent value="greek" className="mt-2">
                <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                  <Button variant="outline" size="sm" className="text-[10px] h-8 px-1" onClick={() => addSymbol("\\alpha")}>Alpha</Button>
                  <Button variant="outline" size="sm" className="text-[10px] h-8 px-1" onClick={() => addSymbol("\\beta")}>Beta</Button>
                  <Button variant="outline" size="sm" className="text-[10px] h-8 px-1" onClick={() => addSymbol("\\pi")}>Pi</Button>
                  <Button variant="outline" size="sm" className="text-[10px] h-8 px-1" onClick={() => addSymbol("\\Delta")}>Delta</Button>
                  <Button variant="outline" size="sm" className="text-[10px] h-8 px-1" onClick={() => addSymbol("\\sigma")}>Sigma</Button>
                  <Button variant="outline" size="sm" className="text-[10px] h-8 px-1" onClick={() => addSymbol("\\omega")}>Omega</Button>
                </div>
              </TabsContent>
            </Tabs>
          </div>

          <div className="lg:col-span-5 flex flex-col">
            <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2">
              Live Preview
            </Label>
            <div className="flex-1 min-h-[200px] flex items-center justify-center rounded-xl border-2 border-dashed bg-muted/30 p-6 overflow-auto shadow-inner">
              <div className="max-w-full scale-125 origin-center transition-all duration-300">
                <BlockMath math={latex || "\\text{Enter an equation...}"} />
              </div>
            </div>
            <div className="mt-4 flex items-start gap-2 p-3 bg-primary/5 rounded-lg border border-primary/10">
              <Info className="h-4 w-4 text-primary shrink-0 mt-0.5" />
              <p className="text-[10px] text-muted-foreground leading-relaxed">
                Use <code className="bg-primary/10 text-primary px-1 rounded">\text{...}</code> for plain text and <code className="bg-primary/10 text-primary px-1 rounded">\quad</code> for spacing.
              </p>
            </div>
          </div>
        </div>
        
        <DialogFooter className="mt-6 sm:justify-between items-center gap-4">
          <div className="hidden sm:flex items-center gap-2 text-xs text-muted-foreground">
            <Sparkles className="h-3 w-3" />
            Supports standard KaTeX syntax
          </div>
          <div className="flex gap-2 w-full sm:w-auto">
            <Button variant="ghost" onClick={onClose} className="flex-1 sm:flex-none">
              Cancel
            </Button>
            <Button onClick={handleInsert} className="flex-1 sm:flex-none">
              Insert Equation
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};