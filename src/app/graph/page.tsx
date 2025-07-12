
"use client";

import { GraphView } from "@/components/GraphView";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function GraphPage() {
  return (
    <main className="h-screen w-screen bg-muted/30 dark:bg-background flex flex-col">
      <header className="p-4 border-b bg-background flex items-center gap-4 shrink-0">
        <Button variant="outline" size="icon" className="shrink-0" asChild>
            <Link href="/">
                <ArrowLeft className="h-4 w-4" />
                <span className="sr-only">Back to Home</span>
            </Link>
        </Button>
        <h1 className="text-xl font-bold font-headline text-primary">
          Knowledge Graph
        </h1>
      </header>
      <div className="flex-1 relative">
        <GraphView />
      </div>
    </main>
  );
}
