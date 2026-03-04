"use client";

import { useState } from "react";
import { GraphView } from "@/components/GraphView";
import Link from "next/link";
import { ArrowLeft, Settings } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ApiKeyDialog } from "@/components/ApiKeyDialog";

export default function GraphPage() {
  const [isApiDialogOpen, setIsApiDialogOpen] = useState(false);

  return (
    <main className="h-screen w-screen bg-muted/30 dark:bg-background flex flex-col">
      <header className="p-4 border-b bg-background flex items-center justify-between shrink-0">
        <div className="flex items-center gap-4">
            <Button variant="outline" size="icon" className="shrink-0" asChild>
                <Link href="/">
                    <ArrowLeft className="h-4 w-4" />
                    <span className="sr-only">Back to Home</span>
                </Link>
            </Button>
            <h1 className="text-xl font-bold font-headline text-primary">
            Knowledge Graph
            </h1>
        </div>
        <Button variant="ghost" size="icon" onClick={() => setIsApiDialogOpen(true)} aria-label="Settings">
            <Settings className="h-5 w-5"/>
        </Button>
      </header>
      <div className="flex-1 relative">
        <GraphView />
      </div>
      <ApiKeyDialog open={isApiDialogOpen} onOpenChange={setIsApiDialogOpen} />
    </main>
  );
}
